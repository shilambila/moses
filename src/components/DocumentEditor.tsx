import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Save, X } from "lucide-react";
import { mysql } from "@/integrations/mysql/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Document {
  id?: string;
  title: string;
  content: string;
  document_type: string;
  meeting_date?: string;
  recipient?: string;
  template_category?: string;
  status: string;
  tags?: string[];
}

interface DocumentEditorProps {
  document?: Document;
  onSave: () => void;
  onCancel: () => void;
}

export const DocumentEditor = ({ document, onSave, onCancel }: DocumentEditorProps) => {
  const [formData, setFormData] = useState<Document>({
    title: "",
    content: "",
    document_type: "meeting_minutes",
    status: "draft",
    tags: [],
    ...document
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await mysql.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        toast.error("Please log in again - your session has expired");
        return;
      }
      if (!user) {
        toast.error("Authentication required - please log in");
        return;
      }

      const documentData = {
        ...formData,
        created_by: user.id,
        updated_at: new Date().toISOString()
      };

      if (document?.id) {
        // Update existing document
        const { error } = await mysql
          .from('documents')
          .update(documentData)
          .eq('id', document.id);

        if (error) throw error;
        toast.success("Document updated successfully");
      } else {
        // Create new document
        const { error } = await mysql
          .from('documents')
          .insert([documentData]);

        if (error) throw error;
        toast.success("Document created successfully");
      }

      onSave();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error("Failed to save document");
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting_minutes': return 'Meeting Minutes';
      case 'official_letter': return 'Official Letter';
      case 'template': return 'Template';
      case 'correspondence': return 'Correspondence';
      default: return type;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>
          {document?.id ? 'Edit Document' : 'Create New Document'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter document title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Document Type *</Label>
            <Select 
              value={formData.document_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting_minutes">Meeting Minutes</SelectItem>
                <SelectItem value="official_letter">Official Letter</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="correspondence">Correspondence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.document_type === 'meeting_minutes' && (
          <div className="space-y-2">
            <Label htmlFor="meeting_date">Meeting Date</Label>
            <Input
              id="meeting_date"
              type="date"
              value={formData.meeting_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
            />
          </div>
        )}

        {(formData.document_type === 'official_letter' || formData.document_type === 'correspondence') && (
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              placeholder="Enter recipient name or organization"
              value={formData.recipient || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
            />
          </div>
        )}

        {formData.document_type === 'template' && (
          <div className="space-y-2">
            <Label htmlFor="template_category">Template Category</Label>
            <Input
              id="template_category"
              placeholder="e.g., Letters, Forms, Reports"
              value={formData.template_category || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, template_category: e.target.value }))}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.tags?.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            placeholder="Enter document content here..."
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            className="min-h-[400px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};