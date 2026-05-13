import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TermDatesWizard, type SchoolData, type CreatedSchool } from './term-dates-wizard';
import { Plus } from 'lucide-react';

export function SchoolsManagement() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [schoolData, setSchoolData] = useState<SchoolData>({
    schoolName: '',
    city: '',
    country: 'United Kingdom',
    address: '',
  });

  const handleOpenWizard = () => {
    if (!schoolData.schoolName.trim()) {
      alert('Please enter a school name');
      return;
    }
    setWizardOpen(true);
  };

  const handleWizardComplete = (createdSchool: CreatedSchool | null) => {
    if (createdSchool) {
      console.log('School created successfully:', createdSchool);
      // Reset form
      setSchoolData({
        schoolName: '',
        city: '',
        country: 'United Kingdom',
        address: '',
      });
      // You can add success notification here
    }
    setWizardOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New School</CardTitle>
          <CardDescription>
            Enter basic school information and we'll help you import term dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                placeholder="e.g., Dartford Grammar School for Girls"
                value={schoolData.schoolName}
                onChange={(e) =>
                  setSchoolData((prev) => ({ ...prev, schoolName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., Dartford"
                value={schoolData.city}
                onChange={(e) => setSchoolData((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g., United Kingdom"
                value={schoolData.country}
                onChange={(e) =>
                  setSchoolData((prev) => ({ ...prev, country: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                placeholder="e.g., Shepherds Lane, Dartford, DA1 2NT"
                value={schoolData.address}
                onChange={(e) =>
                  setSchoolData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <Button onClick={handleOpenWizard} className="w-full" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add School & Import Term Dates
            </Button>
          </div>
        </CardContent>
      </Card>

      <TermDatesWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        schoolData={schoolData}
        onComplete={handleWizardComplete}
      />
    </div>
  );
}
