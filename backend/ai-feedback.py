import json
import os
from AIOperationsService import get_nsw_selective_feedback

def handler(event, context):
    if event["httpMethod"] == "POST":
        try:
            body = json.loads(event["body"])
            content = body.get("content")
            text_type = body.get("textType")
            assistance_level = body.get("assistanceLevel")

            if not content:
                return {
                    "statusCode": 400,
                    "body": json.dumps({"error": "Content is required"})
                }

            feedback = get_nsw_selective_feedback(content, text_type, assistance_level)
            
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

