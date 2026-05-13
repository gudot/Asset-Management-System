"use client";

import React from "react";
import { AppSidebar } from "./app-sidebar";
import MainHeader from "./main-header";
import MainFooter from "./main-footer";

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
}

export function DashboardLayout({
    children,
    title,
    description,
    actions,
}: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <MainHeader />
            <div className="flex flex-1">
                <AppSidebar />
                <main className="min-w-0 flex-1 p-6">
                    {(title || description || actions) && (
                        <div className="mb-8 flex items-start justify-between">
                            <div>
                                {title && <h1 className="text-3xl font-bold">{title}</h1>}
                                {description && (
                                    <p className="mt-2 text-muted-foreground">{description}</p>
                                )}
                            </div>
                            {actions && <div className="flex gap-2">{actions}</div>}
                        </div>
                    )}
                    {children}
                </main>
            </div>
            <MainFooter />
        </div>
    );
}

export default DashboardLayout;
