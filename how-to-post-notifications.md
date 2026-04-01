## **วิธีการส่ง POST notifications:**

### **1. เมื่อมีคนคอมเมนต์บทความ:**

```bash
POST http://localhost:4002/notifications
Content-Type: application/json

{
  "recipient_id": "uuid-of-post-owner",
  "sender_id": "uuid-of-commenter", 
  "type": "comment",
  "related_id": 15
}
```

**ที่เกิดขึ้น:**
- ระบบจะดึงข้อมูล comment_id=15
- ดึงชื่อบทความที่ถูกคอมเมนต์
- สร้าง message: "username commented on your post 'article_title': 'comment_text'"

---

### **2. เมื่อมีคนไลค์บทความ:**

```bash
POST http://localhost:4002/notifications
Content-Type: application/json

{
  "recipient_id": "uuid-of-post-owner",
  "sender_id": "uuid-of-liker",
  "type": "like", 
  "related_id": 5
}
```

**ที่เกิดขึ้น:**
- ระบบจะดึงข้อมูล post_id=5
- ดึงชื่อบทความที่ถูกไลค์
- สร้าง message: "Someone liked your post 'article_title'"

---

## **ตัวอย่างการใช้จริงใน Comment API:**

เพิ่มใน `commentRouter.js` หลังจากสร้าง comment สำเร็จ:

```javascript
// ใน POST /comments หลังจากสร้าง comment สำเร็จ
const commentResult = await connectionPool.query(
  `INSERT INTO comments ... RETURNING *`,
  [post_id, user_id, comment_text]
);

// สร้าง notification ให้เจ้าของ post
if (commentResult.rows[0]) {
  const newComment = commentResult.rows[0];
  
  // ดึงข้อมูลเจ้าของ post
  const postOwnerResult = await connectionPool.query(
    "SELECT user_id FROM posts WHERE id = $1",
    [post_id]
  );
  
  if (postOwnerResult.rows.length > 0) {
    const postOwnerId = postOwnerResult.rows[0].user_id;
    
    // สร้าง notification (ถ้าไม่ใช่คนคอมเมนต์เอง)
    if (postOwnerId !== user_id) {
      await fetch('http://localhost:4002/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: postOwnerId,
          sender_id: user_id,
          type: 'comment',
          related_id: newComment.id
        })
      });
    }
  }
}
```

---

## **ตัวอย่าง Response จาก POST notifications:**

```json
{
  "message": "Notification created successfully",
  "notification": {
    "id": 25,
    "recipient_id": "uuid-of-post-owner",
    "sender_id": "uuid-of-commenter",
    "type": "comment",
    "message": "john_doe commented on your post 'How to Learn JavaScript': 'Great article!'",
    "related_id": 15,
    "is_read": false,
    "created_at": "2026-03-26T14:15:00.000Z"
  }
}
```

---

## **สรุปการส่ง:**

### **Comment Notification:**
- `type`: "comment"
- `related_id`: comment_id
- `recipient_id`: เจ้าของ post
- `sender_id`: คนคอมเมนต์

### **Like Notification:**
- `type`: "like" 
- `related_id`: post_id
- `recipient_id`: เจ้าของ post
- `sender_id`: คนกดไลค์

ระบบจะสร้าง message ให้อัตโนมัติจากข้อมูลในฐานข้อมูล
