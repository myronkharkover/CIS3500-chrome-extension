declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const content: string;
  export default content;
}

declare module 'pdfjs-dist/webpack' {
  export * from 'pdfjs-dist';
} 