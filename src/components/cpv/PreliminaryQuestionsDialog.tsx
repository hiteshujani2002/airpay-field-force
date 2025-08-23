import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface PreliminaryQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (addressCorrect: boolean, merchantPresent: boolean) => void;
  merchantName: string;
}

export const PreliminaryQuestionsDialog = ({
  open,
  onOpenChange,
  onSubmit,
  merchantName,
}: PreliminaryQuestionsDialogProps) => {
  const [addressCorrect, setAddressCorrect] = useState<string>('');
  const [merchantPresent, setMerchantPresent] = useState<string>('');

  const handleSubmit = () => {
    if (addressCorrect && merchantPresent) {
      onSubmit(addressCorrect === 'yes', merchantPresent === 'yes');
      // Reset form
      setAddressCorrect('');
      setMerchantPresent('');
    }
  };

  const canSubmit = addressCorrect && merchantPresent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preliminary Verification Questions</DialogTitle>
          <DialogDescription>
            Please answer the following mandatory questions for <strong>{merchantName}</strong> before proceeding with the CPV form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  1. Is the address given correct?
                </Label>
                <RadioGroup 
                  value={addressCorrect} 
                  onValueChange={setAddressCorrect}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="address-yes" />
                    <Label htmlFor="address-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="address-no" />
                    <Label htmlFor="address-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  2. Is the merchant present on the given address?
                </Label>
                <RadioGroup 
                  value={merchantPresent} 
                  onValueChange={setMerchantPresent}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="merchant-yes" />
                    <Label htmlFor="merchant-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="merchant-no" />
                    <Label htmlFor="merchant-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {addressCorrect === 'no' || merchantPresent === 'no' ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Warning: Answering "No" to either question will mark this lead as rejected.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            variant={addressCorrect === 'no' || merchantPresent === 'no' ? 'destructive' : 'default'}
          >
            {addressCorrect === 'no' || merchantPresent === 'no' ? 'Reject Lead' : 'Proceed to Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};