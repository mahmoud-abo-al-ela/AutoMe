"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_FEATURES = {
    aiProcessing: { enabled: false },
    chat: false,
    prioritySupport: false,
    apiAccess: false,
    customBranding: false,
    dedicatedSupport: false,
};

export default function PlanFormDialog({
    open,
    onClose,
    onSubmit,
    loading,
    isPending,
    mode = "create", // "create" or "edit"
    plan = null,
    availableTypes = [],
}) {
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxCars: 0,
        maxMembers: 0,
        maxImagesPerCar: 0,
        auditLogRetentionDays: null,
        features: DEFAULT_FEATURES,
    });

    const [features, setFeatures] = useState(DEFAULT_FEATURES);

    // Local state for input values to prevent focus loss
    const [inputValues, setInputValues] = useState({
        monthlyPrice: "",
        yearlyPrice: "",
        maxCars: "",
        maxMembers: "",
        maxImagesPerCar: "",
        auditLogRetentionDays: "",
    });

    // Initialize form data when dialog opens or plan changes
    useEffect(() => {
        if (mode === "edit" && plan) {
            setFormData({
                name: plan.name || "",
                type: plan.type || "",
                monthlyPrice: plan.monthlyPrice || 0,
                yearlyPrice: plan.yearlyPrice || 0,
                maxCars: plan.maxCars || 0,
                maxMembers: plan.maxMembers || 0,
                maxImagesPerCar: plan.maxImagesPerCar || 0,
                auditLogRetentionDays: plan.auditLogRetentionDays,
                features: plan.features || DEFAULT_FEATURES,
            });
            setFeatures(plan.features || DEFAULT_FEATURES);
            setInputValues({
                monthlyPrice: plan.monthlyPrice ? (plan.monthlyPrice / 100).toString() : "",
                yearlyPrice: plan.yearlyPrice ? (plan.yearlyPrice / 100).toString() : "",
                maxCars: plan.maxCars === 0 ? "" : plan.maxCars.toString(),
                maxMembers: plan.maxMembers === 0 ? "" : plan.maxMembers.toString(),
                maxImagesPerCar: plan.maxImagesPerCar === 0 ? "" : plan.maxImagesPerCar.toString(),
                auditLogRetentionDays: plan.auditLogRetentionDays === null ? "" : plan.auditLogRetentionDays.toString(),
            });
        } else if (mode === "create") {
            setFormData({
                name: "",
                type: "",
                monthlyPrice: 0,
                yearlyPrice: 0,
                maxCars: 0,
                maxMembers: 0,
                maxImagesPerCar: 0,
                auditLogRetentionDays: null,
                features: DEFAULT_FEATURES,
            });
            setFeatures(DEFAULT_FEATURES);
            setInputValues({
                monthlyPrice: "",
                yearlyPrice: "",
                maxCars: "",
                maxMembers: "",
                maxImagesPerCar: "",
                auditLogRetentionDays: "",
            });
        }
    }, [mode, plan, open]);

    const handleFeatureChange = (key, value) => {
        const newFeatures = { ...features, [key]: value };
        setFeatures(newFeatures);
        setFormData({ ...formData, features: newFeatures });
    };

    const handleSubmit = () => {
        // Update form data with current input values before submitting
        const updatedFormData = {
            ...formData,
            monthlyPrice: Math.round(parseFloat(inputValues.monthlyPrice) * 100) || 0,
            yearlyPrice: Math.round(parseFloat(inputValues.yearlyPrice) * 100) || 0,
            maxCars: inputValues.maxCars === "" ? 0 : parseInt(inputValues.maxCars),
            maxMembers: inputValues.maxMembers === "" ? 0 : parseInt(inputValues.maxMembers),
            maxImagesPerCar: inputValues.maxImagesPerCar === "" ? 0 : parseInt(inputValues.maxImagesPerCar),
            auditLogRetentionDays: inputValues.auditLogRetentionDays === "" ? null : parseInt(inputValues.auditLogRetentionDays),
        };
        onSubmit(updatedFormData);
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create New Plan" : `Edit ${plan?.name}`}</DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Add a new pricing plan to your platform"
                            : `Update pricing and limits for ${plan?.name}`}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="limits">Limits</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Business"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {mode === "create" && (
                            <div className="grid gap-2">
                                <Label htmlFor="type">Plan Type</Label>
                                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTypes.map((type) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
                                <Input
                                    id="monthlyPrice"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 29.00"
                                    value={inputValues.monthlyPrice}
                                    onChange={(e) => setInputValues({ ...inputValues, monthlyPrice: e.target.value })}
                                    onBlur={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, monthlyPrice: Math.round(value * 100) });
                                        setInputValues({ ...inputValues, monthlyPrice: value.toString() });
                                    }}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
                                <Input
                                    id="yearlyPrice"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 290.00"
                                    value={inputValues.yearlyPrice}
                                    onChange={(e) => setInputValues({ ...inputValues, yearlyPrice: e.target.value })}
                                    onBlur={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, yearlyPrice: Math.round(value * 100) });
                                        setInputValues({ ...inputValues, yearlyPrice: value.toString() });
                                    }}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="limits" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="maxCars">Max Cars (-1 = unlimited)</Label>
                                <Input
                                    id="maxCars"
                                    type="number"
                                    value={inputValues.maxCars}
                                    onChange={(e) => setInputValues({ ...inputValues, maxCars: e.target.value })}
                                    onBlur={(e) => {
                                        const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                        setFormData({ ...formData, maxCars: isNaN(value) ? 0 : value });
                                        setInputValues({ ...inputValues, maxCars: value === 0 ? "" : value.toString() });
                                    }}
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="maxMembers">Max Members (-1 = unlimited)</Label>
                                <Input
                                    id="maxMembers"
                                    type="number"
                                    value={inputValues.maxMembers}
                                    onChange={(e) => setInputValues({ ...inputValues, maxMembers: e.target.value })}
                                    onBlur={(e) => {
                                        const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                        setFormData({ ...formData, maxMembers: isNaN(value) ? 0 : value });
                                        setInputValues({ ...inputValues, maxMembers: value === 0 ? "" : value.toString() });
                                    }}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="maxImagesPerCar">Max Images Per Car</Label>
                                <Input
                                    id="maxImagesPerCar"
                                    type="number"
                                    value={inputValues.maxImagesPerCar}
                                    onChange={(e) => setInputValues({ ...inputValues, maxImagesPerCar: e.target.value })}
                                    onBlur={(e) => {
                                        const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                        setFormData({ ...formData, maxImagesPerCar: isNaN(value) ? 0 : value });
                                        setInputValues({ ...inputValues, maxImagesPerCar: value === 0 ? "" : value.toString() });
                                    }}
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="auditLogRetentionDays">Audit Log Retention (days)</Label>
                                <Input
                                    id="auditLogRetentionDays"
                                    type="number"
                                    placeholder="Leave empty for unlimited"
                                    value={inputValues.auditLogRetentionDays}
                                    onChange={(e) => setInputValues({ ...inputValues, auditLogRetentionDays: e.target.value })}
                                    onBlur={(e) => {
                                        const value = e.target.value === "" ? null : parseInt(e.target.value);
                                        setFormData({ ...formData, auditLogRetentionDays: value === null || isNaN(value) ? null : value });
                                        setInputValues({ ...inputValues, auditLogRetentionDays: value === null ? "" : value.toString() });
                                    }}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="aiProcessing"
                                    checked={features.aiProcessing?.enabled || false}
                                    onCheckedChange={(checked) => handleFeatureChange("aiProcessing", { enabled: checked })}
                                />
                                <Label htmlFor="aiProcessing" className="cursor-pointer">AI-Powered Car Analysis</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="chat"
                                    checked={features.chat || false}
                                    onCheckedChange={(checked) => handleFeatureChange("chat", checked)}
                                />
                                <Label htmlFor="chat" className="cursor-pointer">Live Chat Support</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="prioritySupport"
                                    checked={features.prioritySupport || false}
                                    onCheckedChange={(checked) => handleFeatureChange("prioritySupport", checked)}
                                />
                                <Label htmlFor="prioritySupport" className="cursor-pointer">Priority Support</Label>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading || isPending} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || isPending} className="cursor-pointer">
                        {loading || isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {mode === "create" ? "Creating..." : "Saving..."}
                            </>
                        ) : (
                            <>
                                {mode === "create" && <Plus className="h-4 w-4 mr-2" />}
                                {mode === "create" ? "Create Plan" : "Save Changes"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
