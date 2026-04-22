import { type PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1"
                />
                <ScrollViewStyleReset />
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
html,
body,
#root {
    height: 100%;
}

body {
    margin: 0;
    overflow-y: auto;
    overflow-x: hidden;
}
`,
                    }}
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
