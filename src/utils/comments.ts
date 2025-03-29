
export interface Comment {
  id: string;
  paperId: string;
  userAddr: string;
  content: string;
  createdAt: number;
}

export async function getComments(paperId: string): Promise<Comment[]> {
  try {
    const response = await fetch(`http://localhost:3002/api/comments?paperId=${paperId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch comments");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
}

export async function postComment(paperId: string, userAddr: string, content: string): Promise<Comment> {
  try {
    const response = await fetch("http://localhost:3002/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, userAddr, content })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to post comment");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error posting comment:", error);
    throw error;
  }
}
