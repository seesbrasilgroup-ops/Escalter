import { GoogleGenAI } from "@google/genai";
import { ScannerType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTIONS: Record<ScannerType, string> = {
  FOOD: "Você é um nutricionista especialista. Analise a imagem da comida/prato. Forneça uma resposta JSON com: nome_prato, calorias_estimadas, macronutrientes (proteina, carboidratos, gordura em gramas) e uma curta analise_saude (2 frases).",
  VEHICLE: "Você é um mecânico automotivo especialista e perito em seguros. Analise a imagem do dano no veículo. Forneça uma resposta JSON com: dano_detectado, pecas_afetadas (array), nivel_urgencia (Baixo/Médio/Alto), estimativa_custo_reparo_brl, e acoes_recomendadas.",
  DOCUMENT: "Você é um analista legal e de negócios especialista. Analise a imagem do documento/planilha. Forneça uma resposta JSON com: tipo_documento, resumo_proposito, entidades_chave_envolvidas, datas_criticas_ou_obrigacoes, e uma analise_sentimento (Neutro/Positivo/Risco).",
  OBJECT: "Você é um avaliador especialista e buscador de produtos. Analise a imagem do objeto. Forneça uma resposta JSON com: nome_produto, palpite_fabricante, palpite_modelo, estimativa_valor_mercado_brl, e 3_varejistas_potenciais."
};

export const analyzeImage = async (base64Image: string, type: ScannerType): Promise<string> => {
  try {
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Analise esta imagem. Retorne APENAS JSON bruto sem formatação markdown. ${SYSTEM_INSTRUCTIONS[type]}`
          },
        ],
      },
      config: {
        temperature: 0.4,
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw new Error("Falha ao analisar a imagem.");
  }
};