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
        <div className="min-h-screen bg-background">
            <AppSidebar />
            <div className="pl-52">
                <MainHeader />
                <main className="p-6">
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
                <MainFooter />
            </div>
        </div>
    );
}

export default DashboardLayout;
