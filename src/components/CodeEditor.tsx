import React, { useEffect, useRef, useState } from 'react';
import { Play, Save, GitBranch, Upload, Download, Settings, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onAnalyze?: (code: string) => void;
  onSave?: (code: string) => void;
  isAnalyzing?: boolean;
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'solidity',
  onAnalyze,
  onSave,
  isAnalyzing = false
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMonaco = async () => {
      try {
        // Load Monaco Editor from CDN
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js';
        script.onload = () => {
          // @ts-ignore
          window.require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
          // @ts-ignore
          window.require(['vs/editor/editor.main'], () => {
            initializeEditor();
          });
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
        setIsLoading(false);
      }
    };

    const initializeEditor = () => {
      if (!editorRef.current) return;

      // @ts-ignore
      const monaco = window.monaco;
      monacoRef.current = monaco;

      // Register Solidity language
      monaco.languages.register({ id: 'solidity' });
      monaco.languages.setMonarchTokensProvider('solidity', {
        tokenizer: {
          root: [
            [/pragma\s+solidity/, 'keyword'],
            [/contract\s+\w+/, 'keyword'],
            [/function\s+\w+/, 'keyword'],
            [/\b(uint256|uint|int|bool|address|string|bytes|mapping)\b/, 'type'],
            [/\b(public|private|internal|external|pure|view|payable|modifier)\b/, 'keyword'],
            [/\b(if|else|for|while|do|break|continue|return|throw|emit)\b/, 'keyword'],
            [/\b(true|false|null|undefined)\b/, 'constant'],
            [/\/\/.*$/, 'comment'],
            [/\/\*[\s\S]*?\*\//, 'comment'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],
            [/\d+/, 'number'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop']
          ]
        }
      });

      // Create editor instance
      const editor = monaco.editor.create(editorRef.current, {
        value: value,
        language: language,
        theme: 'vs-dark',
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: true,
        minimap: { enabled: true },
        wordWrap: 'on',
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        glyphMargin: true,
        contextmenu: true,
        mouseWheelZoom: true,
        smoothScrolling: true,
        cursorBlinking: 'blink',
        cursorSmoothCaretAnimation: 'on',
        renderWhitespace: 'selection',
        renderControlCharacters: false,
        fontLigatures: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        }
      });

      editorInstanceRef.current = editor;

      // Handle content changes
      editor.onDidChangeModelContent(() => {
        const newValue = editor.getValue();
        onChange(newValue);
      });

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (onSave) {
          onSave(editor.getValue());
        }
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (onAnalyze) {
          onAnalyze(editor.getValue());
        }
      });

      setIsLoading(false);
    };

    loadMonaco();

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorInstanceRef.current && editorInstanceRef.current.getValue() !== value) {
      editorInstanceRef.current.setValue(value);
    }
  }, [value]);

  const handleAnalyze = () => {
    if (onAnalyze && editorInstanceRef.current) {
      onAnalyze(editorInstanceRef.current.getValue());
    }
  };

  const handleSave = () => {
    if (onSave && editorInstanceRef.current) {
      onSave(editorInstanceRef.current.getValue());
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const insertSnippet = (snippet: string) => {
    if (editorInstanceRef.current) {
      const selection = editorInstanceRef.current.getSelection();
      const range = new monacoRef.current.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
      );
      editorInstanceRef.current.executeEdits('', [
        { range: range, text: snippet, forceMoveMarkers: true }
      ]);
      editorInstanceRef.current.focus();
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden border border-gray-700 ${
      isFullscreen ? 'fixed inset-0 z-50' : 'h-96'
    }`}>
      {/* Editor Toolbar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-gray-300 text-sm font-medium ml-4">
            {language === 'solidity' ? 'Contract.sol' : `main.${language}`}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-md text-sm transition-colors"
            title="Analyze Code (Ctrl+Enter)"
          >
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading VS Code Editor...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="h-full w-full" />
      </div>
    </div>
  );
}