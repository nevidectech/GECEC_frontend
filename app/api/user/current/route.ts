import { getCurrentUserAction } from "@/actions/user"

export async function GET() {
  try {
    const result = await getCurrentUserAction()
    
    if (result.success) {
      return Response.json({
        success: true,
        data: result.data
      })
    } else {
      return Response.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Error in GET /api/user/current:", error)
    return Response.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
