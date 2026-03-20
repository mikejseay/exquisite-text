import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock socket.io-client to prevent real connections
vi.mock("socket.io-client", () => ({
    io: () => ({
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
    }),
}));

import App from "components/App/App";

test("renders app title", () => {
    const { container } = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    );
    const titleElement = container.querySelector("h1");
    expect(titleElement).toBeInTheDocument();
    expect(titleElement?.textContent).toBe("Exquisite Text");
});
