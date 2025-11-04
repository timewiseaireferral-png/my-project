import json
import os
from typing import Dict, List, Any, Optional
import language_tool_python
from dataclasses import dataclass
from openai import OpenAI

# Configure OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1" )

print(f"DEBUG: OPENAI_API_KEY loaded: {openai_api_key is not None}")
print(f"DEBUG: OPENAI_API_BASE loaded: {openai_api_base}")

client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base
)

@dataclass
class TextPosition:
    start: int
    end: int

@dataclass
class FeedbackItem:
    exampleFromText: str
    position: TextPosition
    comment: Optional[str] = None
    suggestionForImprovement: Optional[str] = None

@dataclass
class GrammarCorrection:
    original: str
    suggestion: str
    explanation: str
    position: TextPosition

@dataclass
class VocabularyEnhancement:
    original: str
    suggestion: str
    explanation: str
    position: TextPosition

@dataclass
class CriteriaFeedback:
    category: str
    score: int
    strengths: List[FeedbackItem]
    areasForImprovement: List[FeedbackItem]

@dataclass
# --- LanguageTool Integration Start ---

def get_grammar_feedback(text: str) -> List[Dict[str, Any]]:
    """
    Performs a robust grammar check using the LanguageTool library.
    """
    # Use a persistent tool instance if possible, but for a single function call,
    # it's safer to initialize it here or ensure it's a global/cached instance.
    # We will initialize it here for simplicity.
    tool = language_tool_python.LanguageTool('en-US')
    matches = tool.check(text)

    feedback_list = []
    for match in matches:
        # Filter out minor style issues to focus on core grammar
        if match.ruleId in ['WHITESPACE_RULE', 'COMMA_PARENTHESIS_WHITESPACE', 'EN_QUOTES']:
            continue
        
        # Extract the suggested replacement, if available
        suggestion = match.replacements[0] if match.replacements else None
        
        # Determine the type and severity
        match_type = 'grammar-error'
        severity = 'error'
        if match.ruleIssueType in ['misspelling', 'typographical']:
            match_type = 'spelling-error'
            severity = 'error'
        elif match.ruleIssueType in ['style', 'non-standard']:
            match_type = 'style-warning'
            severity = 'warning'

        # LanguageTool uses offset and errorLength, which maps directly to start/end
        feedback_list.append({
            'original': text[match.offset:match.offset + match.errorLength],
            'suggestion': suggestion,
            'explanation': match.message,
            'position': {
                'start': match.offset,
                'end': match.offset + match.errorLength,
            },
            'type': match_type, # Custom field for frontend filtering
            'severity': severity # Custom field for frontend display
        })
    
    return feedback_list

# --- LanguageTool Integration End ---

@dataclass
class DetailedFeedback:
    overallScore: int
    criteriaScores: Dict[str, int]
    feedbackCategories: List[CriteriaFeedback]
    grammarCorrections: List[GrammarCorrection]
    vocabularyEnhancements: List[VocabularyEnhancement]

def get_nsw_selective_feedback(content: str, text_type: str, assistance_level: str) -> Dict[str, Any]:
    if not content or len(content.strip()) < 20:
        return {
            "overallScore": 0,
            "criteriaScores": {
                "ideasAndContent": 0,
                "textStructureAndOrganization": 0,
                "languageFeaturesAndVocabulary": 0,
                "spellingPunctuationAndGrammar": 0
            },
            "feedbackCategories": [],
            "grammarCorrections": [],
            "vocabularyEnhancements": []
        }
    
    word_count = len(content.split())
    
    prompt = f"""
    You are an AI writing tutor specializing in the NSW Selective School writing test for 10-12 year olds. 
    
    Analyze this {text_type} writing ({word_count} words) and provide detailed feedback aligned with NSW Selective criteria.
    
    Text: "{content}"
    
    Provide feedback with:
    1. Overall score out of 100
    2. Individual scores out of 5 for each NSW criteria:
       - Ideas and Content
       - Text Structure and Organization  
       - Language Features and Vocabulary
       - Spelling, Punctuation, and Grammar
    
    For each criteria, identify:
    - 2-3 specific strengths with examples from text and character positions (start, end, 0-indexed)
    - 2-3 specific areas for improvement with examples and positions
    
    Also provide:
        - (Grammar/Spelling corrections are handled separately by a more robust system)
    - 3-5 vocabulary enhancement opportunities with original word, suggested replacement, explanation, and position
    
    Do NOT include "grammarCorrections" in your JSON response. This will be handled by a separate, more robust system.
    
    Return ONLY valid JSON in this exact format:
    {{
        "overallScore": 85,
        "criteriaScores": {{
            "ideasAndContent": 4,
            "textStructureAndOrganization": 4,
            "languageFeaturesAndVocabulary": 3,
            "spellingPunctuationAndGrammar": 4
        }},
        "feedbackCategories": [
            {{
                "category": "Ideas and Content",
                "score": 4,
                "strengths": [
                    {{
                        "exampleFromText": "exact text from student writing",
                        "position": {{"start": 0, "end": 22}},
                        "comment": "specific positive feedback"
                    }}
                ],
                "areasForImprovement": [
                    {{
                        "exampleFromText": "exact text from student writing",
                        "position": {{"start": 45, "end": 68}},
                        "suggestionForImprovement": "specific improvement suggestion"
                    }}
                ]
            }}
        ],
        "grammarCorrections": [
            # This array will be populated by the LanguageTool integration, not the LLM
        ],
        "vocabularyEnhancements": [
            {{
                "original": "simple word",
                "suggestion": "sophisticated word",
                "explanation": "why this word is better",
                "position": {{"start": 62, "end": 68}}
            }}
        ]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert NSW Selective School writing assessor. Return only valid JSON."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=2000,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        content_response = response.choices[0].message.content
        
        feedback_data = json.loads(content_response)
        feedback_data["timings"] = {"modelLatencyMs": 0} # Placeholder, ideally from API response metadata
        feedback_data["modelVersion"] = "gpt-4" # Placeholder, ideally from API response metadata
        feedback_data["id"] = "generated-id" # Placeholder, ideally a unique ID
        
        # 1. Validate LLM-generated positions
        feedback_data = validate_feedback_positions(feedback_data, content)
        
        # 2. Integrate robust grammar checking
        grammar_feedback = get_grammar_feedback(content)
        
        # The LLM is instructed to return an empty list for grammarCorrections.
        # We replace it with the robust LanguageTool results.
        feedback_data["grammarCorrections"] = grammar_feedback
        
        return feedback_data
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        return create_fallback_feedback(content, word_count)
    except Exception as e:
        print(f"Error generating NSW feedback: {e}")
        return create_fallback_feedback(content, word_count)

def validate_feedback_positions(feedback_data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
    text_length = len(original_text)
    
    if "feedbackCategories" in feedback_data:
        for category in feedback_data["feedbackCategories"]:
            if "strengths" in category:
                category["strengths"] = fix_positions_in_items(category["strengths"], original_text, text_length)
            
            if "areasForImprovement" in category:
                category["areasForImprovement"] = fix_positions_in_items(category["areasForImprovement"], original_text, text_length)
    
    if "grammarCorrections" in feedback_data:
        feedback_data["grammarCorrections"] = fix_positions_in_corrections(feedback_data["grammarCorrections"], original_text, text_length)
    
    if "vocabularyEnhancements" in feedback_data:
        feedback_data["vocabularyEnhancements"] = fix_positions_in_corrections(feedback_data["vocabularyEnhancements"], original_text, text_length)
    
    return feedback_data

def fix_positions_in_items(items: List[Dict], original_text: str, text_length: int) -> List[Dict]:
    fixed_items = []
    
    for item in items:
        if "exampleFromText" in item:
            example_text = item["exampleFromText"]
            
            start_pos = original_text.find(example_text)
            
            if start_pos != -1:
                item["position"] = {
                    "start": start_pos,
                    "end": start_pos + len(example_text)
                }
            else:
                item["position"] = {
                    "start": 0,
                    "end": min(len(example_text), text_length)
                }
            
            fixed_items.append(item)
    
    return fixed_items

# NOTE: Since grammarCorrections are now generated by LanguageTool, the LLM is instructed to
# return an empty list. The fix_positions_in_corrections function is now only needed for
# vocabularyEnhancements, but we will keep it general in case the LLM tries to include
# grammarCorrections despite the instruction.

def fix_positions_in_corrections(corrections: List[Dict], original_text: str, text_length: int) -> List[Dict]:
    fixed_corrections = []
    
    for correction in corrections:
        if "original" in correction:
            original_word = correction["original"]
            
            start_pos = original_text.find(original_word)
            
            if start_pos != -1:
                correction["position"] = {
                    "start": start_pos,
                    "end": start_pos + len(original_word)
                }
            else:
                correction["position"] = {
                    "start": 0,
                    "end": min(len(original_word), text_length)
                }
            
            fixed_corrections.append(correction)
    
    return fixed_corrections

def create_fallback_feedback(content: str, word_count: int) -> Dict[str, Any]:
    return {
        "overallScore": 75,
        "criteriaScores": {
            "ideasAndContent": 4,
            "textStructureAndOrganization": 3,
            "languageFeaturesAndVocabulary": 3,
            "spellingPunctuationAndGrammar": 4
        },
        "feedbackCategories": [
            {
                "category": "Ideas and Content",
                "score": 4,
                "strengths": [
                    {
                        "exampleFromText": content[:50] + "..." if len(content) > 50 else content,
                        "position": {"start": 0, "end": min(50, len(content))},
                        "comment": "Shows creative thinking and good understanding of the task"
                    }
                ],
                "areasForImprovement": [
                    {
                        "exampleFromText": content[:30] + "..." if len(content) > 30 else content,
                        "position": {"start": 0, "end": min(30, len(content))},
                        "suggestionForImprovement": "Add more specific details to develop your ideas further"
                    }
                ]
            },
            {
                "category": "Text Structure and Organization",
                "score": 3,
                "strengths": [
                    {
                        "exampleFromText": content[:40] + "..." if len(content) > 40 else content,
                        "position": {"start": 0, "end": min(40, len(content))},
                        "comment": "Your writing follows a logical sequence"
                    }
                ],
                "areasForImprovement": [
                    {
                        "exampleFromText": content[:35] + "..." if len(content) > 35 else content,
                        "position": {"start": 0, "end": min(35, len(content))},
                        "suggestionForImprovement": "Work on stronger paragraph breaks and transitions"
                    }
                ]
            }
        ],
        "grammarCorrections": [
            # Fallback will not run LanguageTool, so this remains a simple placeholder
            {
                "original": "example",
                "suggestion": "improved example",
                "explanation": "This is a sample correction",
                "position": {"start": 0, "end": 7}
            }
        ],
        "vocabularyEnhancements": [
            {
                "original": "good",
                "suggestion": "excellent",
                "explanation": "Use more sophisticated vocabulary",
                "position": {"start": 0, "end": 4}
            }
        ],
        "timings": {"modelLatencyMs": 0},
        "modelVersion": "fallback-model",
        "id": "fallback-id"
    }

async def evaluate_essay(content: str, text_type: str = "narrative", assistance_level: str = "moderate") -> Dict[str, Any]:
    return get_nsw_selective_feedback(content, text_type, assistance_level)