from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.core.rate_limit import limiter
from app.database import get_db
from app.models.contact_message import ContactMessage
from app.services.email_service import send_contact_message_email
from app.schemas.contact import ContactMessageCreate, ContactMessageResponse, ContactMessageRecord

# No shared prefix here (unlike most routers) since this file serves two
# unrelated top-level paths - the public POST /contact and the admin-only
# GET /contact-messages - rather than a resource and its sub-routes.
router = APIRouter(tags=["contact"])


@router.post("/contact", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def submit_contact_message(request: Request, payload: ContactMessageCreate, db: Session = Depends(get_db)):
    """
    PUBLIC endpoint - no auth, mirrors the open pattern used by POST
    /care-requests. Every submission is persisted regardless of whether the
    notification email to support@ succeeds, so a Resend outage never means
    the message is silently lost - delivered=False rows are visible to an
    admin via GET /contact-messages. Rate-limited (3/minute/IP) since this,
    like /care-requests, is public and unauthenticated.
    """
    email_sent = send_contact_message_email(
        visitor_name=payload.name,
        visitor_email=payload.email,
        message=payload.message,
    )

    contact_message = ContactMessage(
        name=payload.name,
        email=payload.email,
        message=payload.message,
        delivered=email_sent,
    )
    db.add(contact_message)
    db.commit()

    return ContactMessageResponse(email_sent=email_sent)


@router.get("/contact-messages", response_model=list[ContactMessageRecord])
def list_contact_messages(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin-only review list, especially for delivered=False rows an email
    outage would otherwise have hidden."""
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
