# Tính năng Tìm kiếm Conversations khi Chia sẻ Tin nhắn

## Tổng quan

Đã thêm tính năng tìm kiếm conversations (direct chat và group chat) khi chia sẻ tin nhắn trong ShareMessageModal.

## Các thay đổi đã thực hiện

### 1. API Layer

- **File**: `src/apis/search.ts`
- **Thêm**: Function `searchConversations(keyword: string)` để gọi API tìm kiếm

### 2. Service Layer

- **File**: `src/services/search.service.ts`
- **Thêm**: Function `searchConversations(keyword: string)` để xử lý business logic

### 3. UI Component

- **File**: `src/app/conversations/direct-chat/ShareMessageModal.tsx`
- **Cải tiến**:
  - Thêm debounce search (300ms delay)
  - Hiển thị loading state khi đang tìm kiếm
  - Hiển thị badge cho loại conversation (Direct/Group)
  - Sử dụng API search thay vì chỉ lọc từ Redux

## Cách hoạt động

### Khi không có từ khóa tìm kiếm:

- Hiển thị danh sách conversations từ Redux store
- Giới hạn 10 conversations đầu tiên

### Khi có từ khóa tìm kiếm:

- Gọi API `/api/search/conversations` với keyword
- Hiển thị loading spinner trong khi tìm kiếm
- Hiển thị kết quả từ API với badge loại conversation

### Debounce:

- Delay 300ms sau khi user ngừng gõ
- Tránh gọi API quá nhiều lần

## API Response Format

```typescript
;[
  {
    id: 123,
    type: "DIRECT", // hoặc "GROUP"
    title: "John Doe",
    avatar: {
      src: "https://example.com/avatar.jpg",
    },
    subtitle: {
      content: "Hello there! How are you?",
    },
  },
]
```

## Logic tìm kiếm (Server-side)

- **Direct Chat**: Tìm theo tên đầy đủ và email của user
- **Group Chat**: Tìm theo tên nhóm
- Chỉ trả về conversations mà user hiện tại có quyền truy cập
- Tìm kiếm không phân biệt hoa thường
- Tìm kiếm theo từ khóa con (contains)

## Test

File test: `temp/test-search-conversations.ts`

- Test với từ khóa "john"
- Test với từ khóa rỗng

## Sử dụng

1. Mở ShareMessageModal
2. Nhập từ khóa vào ô tìm kiếm
3. Đợi 300ms để API được gọi
4. Xem kết quả với badge loại conversation
5. Click vào conversation để chia sẻ tin nhắn
