
import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { pipeline } from "@huggingface/transformers";

const Index = () => {
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const classifierRef = useRef<any>(null);

  const initializeClassifier = async () => {
    try {
      classifierRef.current = await pipeline(
        "image-classification",
        "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
        { device: "cpu" }
      );
      toast.success("Sistema de reconhecimento inicializado!");
    } catch (error) {
      console.error('Erro ao inicializar o reconhecimento:', error);
      toast.error("Erro ao inicializar o sistema de reconhecimento.");
    }
  };

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !classifierRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      
      // Captura o frame atual do vídeo
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      // Ajusta o tamanho do canvas para corresponder ao vídeo
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      
      // Desenha o frame atual no canvas
      context.drawImage(videoRef.current, 0, 0);

      // Converte o canvas para blob e depois para URL
      const blob = await new Promise<Blob>((resolve) => 
        canvasRef.current!.toBlob((blob) => resolve(blob!), 'image/jpeg')
      );
      const imageUrl = URL.createObjectURL(blob);

      // Analisa a imagem
      const result = await classifierRef.current(imageUrl);
      
      // Limpa a URL criada
      URL.revokeObjectURL(imageUrl);

      if (result && result[0]?.label) {
        console.log('Detectado:', result[0].label, 'Confiança:', result[0].score);
        if (result[0].score > 0.7) { // Só mostra se a confiança for maior que 70%
          toast.info(`Detectado: ${result[0].label}`);
        }
      }
    } catch (error) {
      console.error('Erro ao processar frame:', error);
    } finally {
      setIsProcessing(false);
      if (isStreamActive) {
        // Agenda o próximo processamento
        setTimeout(processFrame, 1000); // Processa um frame por segundo
      }
    }
  }, [isProcessing, isStreamActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
        toast.success("Câmera ativada com sucesso!");
        
        // Inicializa o classificador se ainda não foi inicializado
        if (!classifierRef.current) {
          await initializeClassifier();
        }
        
        // Começa a processar frames quando o vídeo estiver pronto
        videoRef.current.onloadedmetadata = () => {
          processFrame();
        };
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
          <canvas
            ref={canvasRef}
            className="hidden" // Canvas escondido, usado apenas para processamento
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
