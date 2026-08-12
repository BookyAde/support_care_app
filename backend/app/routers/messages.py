from uuid import UUID
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.core.dependencies import get_current_admin, get_current_worker, get_current_client, get_current_actor
from app.models.worker import Worker
from app.models.client import Client
from app.models.message import Message
from app.models.thread_read import AdminThreadRead
from app.schemas.message import MessageCreate, MessageUpdate, MessageResponse

router = APIRouter(prefix="/messages", tags=["messages"])

EDIT_WINDOW = timedelta(minutes=15)
# Anything read before this counts as "never read" - everything is unread for
# a thread with no AdminThreadRead row yet.
EPOCH = datetime.min.replace(tzinfo=timezone.utc)


@router.get("/worker/{worker_id}", response_model=list[MessageResponse])
def get_worker_thread(worker_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    return db.query(Message).filter(Message.worker_id == worker_id).order_by(Message.created_at.asc()).all()


@router.post("/worker/{worker_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message_to_worker(
    worker_id: UUID, payload: MessageCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    message = Message(worker_id=worker_id, sender_type="admin", sender_id=admin.id, body=payload.body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/client/{client_id}", response_model=list[MessageResponse])
def get_client_thread(client_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    return db.query(Message).filter(Message.client_id == client_id).order_by(Message.created_at.asc()).all()


@router.post("/client/{client_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message_to_client(
    client_id: UUID, payload: MessageCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    message = Message(client_id=client_id, sender_type="admin", sender_id=admin.id, body=payload.body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.post("/broadcast", status_code=status.HTTP_201_CREATED)
def broadcast_message(payload: MessageCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    workers = db.query(Worker).filter(Worker.is_active == True).all()  # noqa: E712
    for w in workers:
        db.add(Message(worker_id=w.id, sender_type="admin", sender_id=admin.id, body=payload.body, is_broadcast=True))
    db.commit()
    return {"sent_to": len(workers)}


@router.get("/mine", response_model=list[MessageResponse])
def get_my_thread(worker=Depends(get_current_worker), db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.worker_id == worker.id).order_by(Message.created_at.asc()).all()

    unread_admin_messages = [m for m in messages if m.sender_type == "admin" and m.read_at is None]
    if unread_admin_messages:
        now = datetime.now(timezone.utc)
        for message in unread_admin_messages:
            message.read_at = now
        db.commit()

    return messages


@router.post("/mine", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message_as_worker(payload: MessageCreate, worker=Depends(get_current_worker), db: Session = Depends(get_db)):
    message = Message(worker_id=worker.id, sender_type="worker", sender_id=worker.id, body=payload.body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/mine-as-client", response_model=list[MessageResponse])
def get_my_thread_as_client(client=Depends(get_current_client), db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.client_id == client.id).order_by(Message.created_at.asc()).all()

    unread_admin_messages = [m for m in messages if m.sender_type == "admin" and m.read_at is None]
    if unread_admin_messages:
        now = datetime.now(timezone.utc)
        for message in unread_admin_messages:
            message.read_at = now
        db.commit()

    return messages


@router.post("/mine-as-client", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message_as_client(payload: MessageCreate, client=Depends(get_current_client), db: Session = Depends(get_db)):
    message = Message(client_id=client.id, sender_type="client", sender_id=client.id, body=payload.body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.post("/worker/{worker_id}/mark-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_worker_thread_read(worker_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    now = datetime.now(timezone.utc)
    read_row = db.query(AdminThreadRead).filter(AdminThreadRead.worker_id == worker_id).first()
    if read_row:
        read_row.last_read_at = now
    else:
        db.add(AdminThreadRead(worker_id=worker_id, last_read_at=now))
    db.commit()


@router.post("/client/{client_id}/mark-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_client_thread_read(client_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    now = datetime.now(timezone.utc)
    read_row = db.query(AdminThreadRead).filter(AdminThreadRead.client_id == client_id).first()
    if read_row:
        read_row.last_read_at = now
    else:
        db.add(AdminThreadRead(client_id=client_id, last_read_at=now))
    db.commit()


@router.get("/unread-summary")
def get_unread_summary(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    read_rows = db.query(AdminThreadRead).all()
    worker_last_read = {r.worker_id: r.last_read_at for r in read_rows if r.worker_id is not None}
    client_last_read = {r.client_id: r.last_read_at for r in read_rows if r.client_id is not None}

    worker_ids = [
        row[0] for row in db.query(Message.worker_id).filter(Message.worker_id.isnot(None)).distinct().all()
    ]
    client_ids = [
        row[0] for row in db.query(Message.client_id).filter(Message.client_id.isnot(None)).distinct().all()
    ]

    by_worker: dict[str, int] = {}
    for worker_id in worker_ids:
        last_read = worker_last_read.get(worker_id, EPOCH)
        count = (
            db.query(Message)
            .filter(
                Message.worker_id == worker_id,
                Message.sender_type != "admin",
                Message.created_at > last_read,
                Message.deleted_at.is_(None),
            )
            .count()
        )
        if count > 0:
            by_worker[str(worker_id)] = count

    by_client: dict[str, int] = {}
    for client_id in client_ids:
        last_read = client_last_read.get(client_id, EPOCH)
        count = (
            db.query(Message)
            .filter(
                Message.client_id == client_id,
                Message.sender_type != "admin",
                Message.created_at > last_read,
                Message.deleted_at.is_(None),
            )
            .count()
        )
        if count > 0:
            by_client[str(client_id)] = count

    total_unread = sum(by_worker.values()) + sum(by_client.values())

    return {"total_unread": total_unread, "by_worker": by_worker, "by_client": by_client}


@router.patch("/{message_id}", response_model=MessageResponse)
def edit_message(
    message_id: UUID, payload: MessageUpdate, actor: tuple[UUID, str] = Depends(get_current_actor), db: Session = Depends(get_db)
):
    actor_id, actor_type = actor
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if message.sender_type != actor_type or message.sender_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own messages")
    if datetime.now(timezone.utc) - message.created_at > EDIT_WINDOW:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This message can no longer be edited")
    if message.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This message has been deleted")

    message.body = payload.body
    message.edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return message


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: UUID, actor: tuple[UUID, str] = Depends(get_current_actor), db: Session = Depends(get_db)):
    actor_id, actor_type = actor
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if message.sender_type != actor_type or message.sender_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own messages")
    if datetime.now(timezone.utc) - message.created_at > EDIT_WINDOW:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This message can no longer be deleted")
    if message.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This message has already been deleted")

    message.deleted_at = datetime.now(timezone.utc)
    db.commit()
