
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [isStreamActive, setIsStreamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Usa a câmera traseira em dispositivos móveis
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
        toast.success("Câmera ativada com sucesso!");
      }
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      toast.error("Erro ao acessar a câmera. Por favor, permita o acesso.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
      toast.info("Câmera desativada");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center mb-6">AR Estampas</h1>
        
        <div className="relative aspect-[3/4] w-full bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={isStreamActive ? stopCamera : startCamera}
            variant={isStreamActive ? "destructive" : "default"}
            className="w-full max-w-xs"
          >
            {isStreamActive ? "Desativar Câmera" : "Ativar Câmera"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
