import * as React from "react";

export default function NoResults({ message }: { message: string }): JSX.Element {
    return (
        <div style={{ textAlign: "center" }}>
            <h4>
                {message}
            </h4>
        </div>
    );
}
