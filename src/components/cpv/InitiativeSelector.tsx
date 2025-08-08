
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InitiativeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const initiatives = [
  { value: "banking", label: "Banking Initiative" },
  { value: "insurance", label: "Insurance Initiative" },
  { value: "na", label: "NA" }
];

export const InitiativeSelector: React.FC<InitiativeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="initiative-select">Select Initiative</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="initiative-select" className="w-full">
          <SelectValue placeholder="Choose an initiative" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-md z-50">
          {initiatives.map((initiative) => (
            <SelectItem 
              key={initiative.value} 
              value={initiative.value}
              className="hover:bg-gray-100 cursor-pointer"
            >
              {initiative.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
