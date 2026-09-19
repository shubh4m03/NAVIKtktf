from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.nirnay.orchestrator import process_nirnay_query

router = APIRouter(prefix="/nirnay", tags=["NIRNAY AI Orchestrator"])

class NirnayMessage(BaseModel):
    role: str
    content: str

class NirnayChatRequest(BaseModel):
    messages: List[NirnayMessage]
    context: Optional[Dict[str, Any]] = None

class NirnayChatResponse(BaseModel):
    response: str
    grounding_data: Dict[str, Any]

@router.post("/chat", response_model=NirnayChatResponse)
async def chat_with_nirnay(request: NirnayChatRequest):
    """
    POST /api/v1/nirnay/chat endpoint.
    Handles NIRNAY AI queries by orchestrating real tool calls and grounding the response.
    """
    try:
        # Extract the latest user query
        user_query = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                user_query = msg.content
                break
        
        if not user_query:
            raise HTTPException(status_code=400, detail="No user message found.")
        
        # Process the query through the orchestrator
        result = process_nirnay_query(user_query, request.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
