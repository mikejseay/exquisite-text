import * as React from "react";

export default function Poem404({ content }: { content: string }): JSX.Element {
    return (
        <div style={{ textAlign: "center" }}>
            <h4>
                {content}
            </h4>
        </div>
    );
}
