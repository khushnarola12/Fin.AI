"use client"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Charts from "@/components/ui/Charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// import { Progress } from "@/components/ui/progress"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"

export default function UploadCSV() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file")
      return
    }

    setLoading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`)
      }

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    multiple: false,
    disabled: loading,
  })

  const resetUpload = () => {
    setStats(null)
    setError(null)
    setUploadProgress(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-4">
        {!stats ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                CSV Financial Analyzer
              </h1>
              <p className="text-lg text-muted-foreground">
                Upload your financial CSV file to generate comprehensive analytics and visualizations
              </p>
            </div>

            <Card className="shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload CSV File
                </CardTitle>
                <CardDescription>Drag and drop your CSV file here, or click to browse</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    p-8 text-center cursor-pointer rounded-lg transition-all duration-200
                    ${
                      isDragActive
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400"
                        : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                    ${loading ? "pointer-events-none opacity-50" : ""}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    {isDragActive ? (
                      <p className="text-lg font-medium text-blue-600">Drop your CSV file here...</p>
                    ) : (
                      <div>
                        <p className="text-lg font-medium mb-2">Choose a CSV file or drag it here</p>
                        <p className="text-sm text-muted-foreground">
                          Supports financial data with Date, Description, Transaction Type, Transaction Amount, and
                          Balance columns
                        </p>
                      </div>
                    )}

                    {!loading && <Button className="mt-4">Browse Files</Button>}
                  </div>
                </div>

                {loading && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing your file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Expected CSV Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Your CSV file should contain the following columns:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <strong>Date:</strong> Transaction date (MM/DD/YYYY format)
                    </li>
                    <li>
                      <strong>Description:</strong> Transaction description
                    </li>
                    <li>
                      <strong>Transaction Type:</strong> "debit" or "credit"
                    </li>
                    <li>
                      <strong>Transaction Amount:</strong> Numerical amount
                    </li>
                    <li>
                      <strong>Balance:</strong> Account balance after transaction
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <Alert className="flex-1 mr-4 border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  CSV file processed successfully! Your financial analytics are ready.
                </AlertDescription>
              </Alert>
              <Button variant="outline" onClick={resetUpload} className="flex items-center gap-2 bg-transparent">
                <X className="h-4 w-4" />
                Upload New File
              </Button>
            </div>
            <Charts data={stats} />
          </div>
        )}
      </div>
    </div>
  )
}
