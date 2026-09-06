import { useEffect, useRef } from 'react'
import { Modal } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  url: string
  title: string
}

export function SecureDocumentViewer({ open, onClose, url, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Disable right click on the container
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    
    const el = containerRef.current
    if (el) {
      el.addEventListener('contextmenu', handleContextMenu)
    }
    
    return () => {
      if (el) {
        el.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [open])

  if (!open) return null

  // Append #toolbar=0 to disable the default PDF viewer toolbar if it's a PDF
  const secureUrl = url.includes('.pdf') ? `${url}#toolbar=0&navpanes=0&scrollbar=0` : url

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <div className="relative h-[70vh] bg-slate-100 rounded-xl overflow-hidden" ref={containerRef}>
        {/* An invisible overlay to prevent interacting with the iframe directly if needed for extra security */}
        {/* <div className="absolute inset-0 z-10 bg-transparent"></div> */}
        <iframe
          src={secureUrl}
          className="w-full h-full border-none pointer-events-auto"
          title={title}
        />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg backdrop-blur-sm">
            🔒 Mode Aman (Download dinonaktifkan)
          </div>
        </div>
      </div>
    </Modal>
  )
}
