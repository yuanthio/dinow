"use client";

import { useState } from "react";
import { Filter, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSortByProps {
  onFilterChange: (filters: {
    category?: string;
    priority?: string;
    sortBy: string;
    sortOrder: string;
  }) => void;
  currentFilters: {
    category?: string;
    priority?: string;
    sortBy: string;
    sortOrder: string;
  };
}

const CATEGORIES = [
  { value: "PERSONAL", label: "Personal" },
  { value: "WORK", label: "Work" },
  { value: "STUDY", label: "Study" },
  { value: "HEALTH", label: "Health" },
  { value: "FINANCE", label: "Finance" },
  { value: "HOBBY", label: "Hobby" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "HIGH", label: "High Priority" },
  { value: "MEDIUM", label: "Medium Priority" },
  { value: "LOW", label: "Low Priority" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created Date" },
  { value: "name", label: "Name" },
  { value: "priority", label: "Priority" },
  { value: "deadline", label: "Deadline" },
  { value: "category", label: "Category" },
];

const SORT_ORDERS = [
  { value: "asc", label: "A-Z / Oldest" },
  { value: "desc", label: "Z-A / Newest" },
];

export default function FilterSortBy({ onFilterChange, currentFilters }: FilterSortByProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: string | undefined) => {
    const newFilters = { ...currentFilters, [key]: value };
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    onFilterChange({
      category: undefined,
      priority: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setIsOpen(false); // Close panel after reset
  };

  const hasActiveFilters = currentFilters.category || currentFilters.priority;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`gap-2 ${hasActiveFilters ? "bg-blue-600 hover:bg-blue-700" : ""}`}
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filter</span>
        {hasActiveFilters && (
          <span className="bg-blue-700 text-white text-xs px-1.5 rounded-full">
            {[currentFilters.category, currentFilters.priority].filter(Boolean).length}
          </span>
        )}
      </Button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Filter & Sort</h3>
                </div>
                <div className="flex items-center gap-1">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <Select
                  value={currentFilters.category || "all"}
                  onValueChange={(value) => handleFilterChange("category", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <Select
                  value={currentFilters.priority || "all"}
                  onValueChange={(value) => handleFilterChange("priority", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort By
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Field
                    </label>
                    <Select
                      value={currentFilters.sortBy}
                      onValueChange={(value) => handleFilterChange("sortBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Order
                    </label>
                    <Select
                      value={currentFilters.sortOrder}
                      onValueChange={(value) => handleFilterChange("sortOrder", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_ORDERS.map((order) => (
                          <SelectItem key={order.value} value={order.value}>
                            {order.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Apply & Reset Buttons */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1 border-gray-300 hover:border-gray-400"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
