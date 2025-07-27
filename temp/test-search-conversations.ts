import { searchConversations } from "@/services/search.service"

async function testSearchConversations() {
  try {
    console.log("Testing search conversations API...")

    // Test với từ khóa "john"
    const results = await searchConversations("john")
    console.log("Search results for 'john':", results)

    // Test với từ khóa rỗng
    const emptyResults = await searchConversations("")
    console.log("Search results for empty string:", emptyResults)
  } catch (error) {
    console.error("Error testing search conversations:", error)
  }
}

// Chạy test
testSearchConversations()
