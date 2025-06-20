import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { BulkUploadResult, QuestionFormData } from '../types/admin';
import { LoadingSpinner } from './LoadingSpinner';

interface BulkUploadProps {
  onUpload: (result: BulkUploadResult) => void;
  onCancel: () => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onUpload, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      alert('Please upload a CSV or JSON file');
      return;
    }

    setIsLoading(true);
    
    try {
      const text = await file.text();
      let questions: QuestionFormData[] = [];
      const errors: string[] = [];

      if (file.name.endsWith('.csv')) {
        questions = parseCSV(text, errors);
      } else {
        questions = parseJSON(text, errors);
      }

      const result: BulkUploadResult = {
        success: questions.length,
        failed: errors.length,
        errors,
        questions,
      };

      setUploadResult(result);
    } catch (error) {
      alert('Error reading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (text: string, errors: string[]): QuestionFormData[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const questions: QuestionFormData[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      try {
        const columns = parseCSVLine(lines[i]);
        
        if (columns.length < 7) {
          errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }

        const [question, option1, option2, option3, option4, correctAnswer, difficulty, category, explanation] = columns;
        
        const options = [option1, option2, option3, option4].filter(opt => opt.trim());
        const correctIndex = parseInt(correctAnswer) - 1;
        
        if (options.length < 2) {
          errors.push(`Row ${i + 1}: At least 2 options required`);
          continue;
        }
        
        if (correctIndex < 0 || correctIndex >= options.length) {
          errors.push(`Row ${i + 1}: Invalid correct answer index`);
          continue;
        }

        questions.push({
          question: question.trim(),
          options,
          correctAnswer: correctIndex,
          explanation: explanation?.trim() || '',
          difficulty: (difficulty?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium',
          category: category?.trim() || 'General',
          isActive: true,
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }
    
    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(item => item.replace(/^"|"$/g, ''));
  };

  const parseJSON = (text: string, errors: string[]): QuestionFormData[] => {
    try {
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        errors.push('JSON must contain an array of questions');
        return [];
      }
      
      return data.map((item, index) => {
        if (!item.question || !Array.isArray(item.options) || typeof item.correctAnswer !== 'number') {
          errors.push(`Item ${index + 1}: Missing required fields`);
          return null;
        }
        
        return {
          question: item.question,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation || '',
          difficulty: item.difficulty || 'medium',
          category: item.category || 'General',
          isActive: true,
        };
      }).filter(Boolean) as QuestionFormData[];
    } catch (error) {
      errors.push('Invalid JSON format');
      return [];
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Question,Option 1,Option 2,Option 3,Option 4,Correct Answer (1-4),Difficulty,Category,Explanation
"What is the capital of France?","London","Berlin","Paris","Madrid",3,"easy","Geography","Paris is the capital and largest city of France."
"Which planet is known as the Red Planet?","Venus","Mars","Jupiter","Saturn",2,"easy","Science","Mars is called the Red Planet due to its reddish appearance."`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleConfirmUpload = () => {
    if (uploadResult) {
      onUpload(uploadResult);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Bulk Upload Questions</h2>
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!uploadResult ? (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Upload Instructions</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Upload CSV or JSON files containing questions</li>
                  <li>• CSV format: Question, Option 1, Option 2, Option 3, Option 4, Correct Answer (1-4), Difficulty, Category, Explanation</li>
                  <li>• JSON format: Array of objects with question, options, correctAnswer, difficulty, category, explanation</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
              </div>

              {/* Template Download */}
              <div className="flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV Template</span>
                </button>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {isLoading ? (
                  <LoadingSpinner size="lg" text="Processing file..." />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-700 mb-2">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      Supports CSV and JSON files up to 5MB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </>
                )}
              </div>
            </>
          ) : (
            /* Upload Results */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Successful</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">{uploadResult.success}</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">{uploadResult.failed}</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {uploadResult.success + uploadResult.failed}
                  </p>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setUploadResult(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploadResult.success === 0}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                >
                  Import {uploadResult.success} Questions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};