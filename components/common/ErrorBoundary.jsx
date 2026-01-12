"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">
                        {this.props.fallbackMessage ||
                            "We encountered an error while loading this content."}
                    </p>
                    <Button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="cursor-pointer"
                    >
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
