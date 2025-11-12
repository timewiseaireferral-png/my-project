/**
 * Auto-Save Service for Writing Content
 * Automatically saves content to Supabase and provides draft recovery
 */

import { supabase } from './supabase';

export interface DraftData {
  id?: string;
  content: string;
  textType: string;
  wordCount: number;
  title?: string;
  lastSaved: Date;
}

const AUTOSAVE_KEY = 'writing_mate_draft';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

class AutoSaveService {
  private autosaveTimer: NodeJS.Timeout | null = null;
  private lastContent: string = '';
  private currentDraftId: string | null = null;

  /**
   * Start auto-save for current writing session
   */
  startAutoSave(
    getContent: () => string,
    getTextType: () => string,
    userId?: string
  ): void {
    // Clear any existing timer
    this.stopAutoSave();

    // Start new timer
    this.autosaveTimer = setInterval(async () => {
      const content = getContent();
      const textType = getTextType();

      // Only save if content has changed
      if (content !== this.lastContent && content.trim().length > 0) {
        await this.saveDraft(content, textType, userId);
        this.lastContent = content;
      }
    }, AUTOSAVE_INTERVAL);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  /**
   * Save draft to both localStorage and Supabase
   */
  async saveDraft(
    content: string,
    textType: string,
    userId?: string
  ): Promise<void> {
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

    const draftData: DraftData = {
      content,
      textType,
      wordCount,
      title: `Draft - ${new Date().toLocaleString()}`,
      lastSaved: new Date()
    };

    // Save to localStorage (always works, even offline)
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData));
      console.log('✓ Draft saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }

    // Save to Supabase if user is logged in
    if (userId && supabase) {
      try {
        if (this.currentDraftId) {
          // Update existing draft
          const { error } = await supabase
            .from('writings')
            .update({
              content,
              word_count: wordCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', this.currentDraftId)
            .eq('user_id', userId);

          if (error) throw error;
          console.log('✓ Draft updated in Supabase');
        } else {
          // Create new draft
          const { data, error } = await supabase
            .from('writings')
            .insert({
              user_id: userId,
              title: draftData.title,
              content,
              text_type: textType,
              word_count: wordCount
            })
            .select()
            .single();

          if (error) throw error;
          if (data) {
            this.currentDraftId = data.id;
            console.log('✓ New draft created in Supabase');
          }
        }
      } catch (error) {
        console.error('Error saving to Supabase:', error);
        // Don't throw - localStorage save still succeeded
      }
    }
  }

  /**
   * Load most recent draft from localStorage or Supabase
   */
  async loadDraft(userId?: string): Promise<DraftData | null> {
    // Try Supabase first if user is logged in
    if (userId && supabase) {
      try {
        const { data, error } = await supabase
          .from('writings')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          this.currentDraftId = data.id;
          console.log('✓ Draft loaded from Supabase');
          return {
            id: data.id,
            content: data.content,
            textType: data.text_type,
            wordCount: data.word_count,
            title: data.title,
            lastSaved: new Date(data.updated_at)
          };
        }
      } catch (error) {
        console.log('No draft found in Supabase, trying localStorage...');
      }
    }

    // Fall back to localStorage
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const draftData = JSON.parse(saved);
        console.log('✓ Draft loaded from localStorage');
        return {
          ...draftData,
          lastSaved: new Date(draftData.lastSaved)
        };
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }

    return null;
  }

  /**
   * Clear draft from both localStorage and set current draft ID to null
   */
  clearDraft(): void {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      this.currentDraftId = null;
      this.lastContent = '';
      console.log('✓ Draft cleared');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }

  /**
   * Get current draft ID
   */
  getCurrentDraftId(): string | null {
    return this.currentDraftId;
  }

  /**
   * Set current draft ID (when loading existing draft)
   */
  setCurrentDraftId(id: string | null): void {
    this.currentDraftId = id;
  }

  /**
   * Manual save (called when user explicitly saves)
   */
  async manualSave(
    content: string,
    textType: string,
    title: string,
    userId?: string
  ): Promise<string | null> {
    if (!userId || !supabase) {
      console.error('User must be logged in to manually save');
      return null;
    }

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

    try {
      if (this.currentDraftId) {
        // Update existing
        const { error } = await supabase
          .from('writings')
          .update({
            title,
            content,
            text_type: textType,
            word_count: wordCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.currentDraftId)
          .eq('user_id', userId);

        if (error) throw error;
        console.log('✓ Writing saved successfully');
        return this.currentDraftId;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('writings')
          .insert({
            user_id: userId,
            title,
            content,
            text_type: textType,
            word_count: wordCount
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          this.currentDraftId = data.id;
          console.log('✓ Writing created successfully');
          return data.id;
        }
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }

    return null;
  }

  /**
   * Load specific writing by ID
   */
  async loadWriting(writingId: string, userId: string): Promise<DraftData | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('writings')
        .select('*')
        .eq('id', writingId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        this.currentDraftId = data.id;
        return {
          id: data.id,
          content: data.content,
          textType: data.text_type,
          wordCount: data.word_count,
          title: data.title,
          lastSaved: new Date(data.updated_at)
        };
      }
    } catch (error) {
      console.error('Error loading writing:', error);
    }

    return null;
  }

  /**
   * List all writings for a user
   */
  async listWritings(userId: string, limit: number = 10): Promise<DraftData[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('writings')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (data) {
        return data.map(item => ({
          id: item.id,
          content: item.content,
          textType: item.text_type,
          wordCount: item.word_count,
          title: item.title,
          lastSaved: new Date(item.updated_at)
        }));
      }
    } catch (error) {
      console.error('Error listing writings:', error);
    }

    return [];
  }

  /**
   * Delete a writing
   */
  async deleteWriting(writingId: string, userId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('writings')
        .delete()
        .eq('id', writingId)
        .eq('user_id', userId);

      if (error) throw error;

      if (this.currentDraftId === writingId) {
        this.currentDraftId = null;
      }

      console.log('✓ Writing deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting writing:', error);
      return false;
    }
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();

// Export utility function to check if draft exists
export function hasDraft(): boolean {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    return saved !== null;
  } catch {
    return false;
  }
}

// Export utility to get last saved time
export function getLastSavedTime(): Date | null {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return new Date(data.lastSaved);
    }
  } catch {
    return null;
  }
  return null;
}
