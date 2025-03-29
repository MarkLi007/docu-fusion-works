
export interface DiffChunk {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export async function getDiff(paperId: string, verA: string, verB: string): Promise<DiffChunk[]> {
  try {
    const response = await fetch(`http://localhost:3002/api/diff?paperId=${paperId}&verA=${verA}&verB=${verB}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch diff");
    }
    
    const data = await response.json();
    return data.diff;
  } catch (error) {
    console.error("Error fetching diff:", error);
    throw error;
  }
}

export async function submitVersionText(paperId: string, versionIndex: string, text: string): Promise<void> {
  try {
    const response = await fetch("http://localhost:3002/api/version", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, versionIndex, text })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit version text");
    }
  } catch (error) {
    console.error("Error submitting version text:", error);
    throw error;
  }
}
