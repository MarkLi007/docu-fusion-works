
import { toast } from "../hooks/use-toast";

export interface User {
  id: string;
  username: string;
  role: string;
}

export async function login(username: string, password: string): Promise<{token: string, role: string}> {
  try {
    const response = await fetch("http://localhost:3002/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }
    
    // Save the token to localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.role);
    
    return data;
  } catch (error) {
    throw new Error((error as Error).message);
  }
}

export async function register(username: string, password: string, email: string): Promise<{token: string, role: string}> {
  try {
    const response = await fetch("http://localhost:3002/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }
    
    // Save the token to localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.role);
    
    return data;
  } catch (error) {
    throw new Error((error as Error).message);
  }
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  window.location.href = "/";
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getUserRole(): string | null {
  return localStorage.getItem("userRole");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function useAuthGuard(): boolean {
  if (!isAuthenticated()) {
    toast({
      title: "未登录",
      description: "请先登录后再访问此页面",
      variant: "destructive"
    });
    return false;
  }
  return true;
}
