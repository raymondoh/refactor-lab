import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

// Mock the mobile detection hook to always return true
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => true,
}))

function TestSidebar() {
  const { setOpenMobile, openMobile } = useSidebar()

  React.useEffect(() => {
    setOpenMobile(true)
  }, [setOpenMobile])

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#">Link</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div data-testid="open-state">{openMobile ? "open" : "closed"}</div>
    </>
  )
}

test("closes mobile sidebar when link is clicked", () => {
  render(
    <SidebarProvider>
      <TestSidebar />
    </SidebarProvider>
  )

  expect(screen.getByTestId("open-state")).toHaveTextContent("open")
  fireEvent.click(screen.getByText("Link"))
  expect(screen.getByTestId("open-state")).toHaveTextContent("closed")
})
