import json
import os
from AIOperationsService import get_nsw_selective_feedback

def handler(event, context):
    if event["httpMethod"] == "POST":
        try:
            body = json.loads(event["body"] )
            content = body.get("content")
            text_type = body.get("textType")
            assistance_level = body.get("assistanceLevel")

            # The get_nsw_selective_feedback function already checks for empty content.
            # It returns a specific structure that we can check for here.
            feedback = get_nsw_selective_feedback(content, text_type, assistance_level)
            
            # If feedbackCategories is empty, it means there's no feedback to give.
            if not feedback.get("feedbackCategories"):
                return {
                    "statusCode": 204,  # No Content
                    "body": ""
                }

            return {
                "statusCode": 200,
                "headers": { "Content-Type": "application/json" },
                "body": json.dumps(feedback)
            }
        except Exception as e:
            return {
                "statusCode": 500,
                "body": json.dumps({"error": str(e)})
            }
    return {
        "statusCode": 405,
        "body": "Method Not Allowed"
    }
