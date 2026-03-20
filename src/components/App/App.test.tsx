import * as React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock socket.io-client to prevent real connections
jest.mock("socket.io-client", () => ({
    io: () => ({
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
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
