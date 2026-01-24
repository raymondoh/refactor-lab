import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCardButton } from "./ProductCardButton";
import { useCart } from "@/contexts/CartContext";

// Mock product data
const mockProduct = {
  id: "prod_123",
  name: "Test Product",
  price: 19.99,
  image: "test.jpg",
  category: "Test",
  description: "A product used for testing.",
  stock: 10,
  inStock: true, // ✅ add this
  createdAt: new Date().toISOString() // ✅ or whatever your app expects
} as const;

// Mock useCart hook
jest.mock("@/contexts/CartContext", () => ({
  useCart: jest.fn()
}));

describe("ProductCardButton", () => {
  it("renders button with text and icon", () => {
    (useCart as jest.Mock).mockReturnValue({ addItem: jest.fn() });

    render(<ProductCardButton product={mockProduct} />);

    // Check button text and icon are present
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.getByTestId("lucide-icon")).toBeInTheDocument();
  });

  it("calls addItem when clicked", () => {
    const mockAddItem = jest.fn();
    (useCart as jest.Mock).mockReturnValue({ addItem: mockAddItem });

    render(<ProductCardButton product={mockProduct} />);

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith(mockProduct, 1);
  });
});
