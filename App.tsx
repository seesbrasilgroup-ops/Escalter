import React, { useState, useRef } from 'react';
import { 
  Scan, User, Shield, Zap, FileText, ShoppingBag, 
  Car, Utensils, ChevronRight, Upload, Camera, X, Loader2,
  LayoutDashboard, History, DollarSign, MessageSquare, Menu, LogOut,
  BarChart3, PieChart, FileCheck, ArrowRight,
  Twitter, Linkedin, Instagram, Github, Globe, Mail
} from 'lucide-react';
import HeroScanner from './components/HeroScanner';
import { User as UserType, ScanResult, ScannerType } from './types';
import { analyzeImage } from './services/geminiService';

// --- Components defined here to fit constraints ---

const Navbar: React.FC<{ 
    user: UserType | null, 
    onLogin: () => void, 
    onLogout: () => void,
    onNavigate: (page: string) => void 
}> = ({ user, onLogin, onLogout, onNavigate }) => (
  <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wider text-black">ESCA<span className="text-gray-500">LTER</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => onNavigate('scanners')} className="text-gray-600 hover:text-black transition-colors font-medium">Scanners</button>
          <button onClick={() => onNavigate('pricing')} className="text-gray-600 hover:text-black transition-colors font-medium">Planos</button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Plano {user.tier === 'GOLD' ? 'OURO' : user.tier === 'SILVER' ? 'PRATA' : 'GRÁTIS'} • {user.credits} Créditos
              </span>
              <button 
                onClick={() => onNavigate(user.isAdmin ? 'admin' : 'dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-200 transition-all text-black font-medium"
              >
                <User className="w-4 h-4" />
                {user.name}
              </button>
              <button onClick={onLogout} className="text-gray-400 hover:text-black"><LogOut className="w-5 h-5"/></button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-all transform hover:-translate-y-0.5"
            >
              Acessar Portal
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const ServiceCard: React.FC<{ 
    icon: React.ReactNode, 
    title: string, 
    desc: string, 
    color: string,
    onClick: () => void 
}> = ({ icon, title, desc, color, onClick }) => (
  <div onClick={onClick} className="group relative p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl">
    <div className={`mb-6 w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 text-${color} border border-gray-100 group-hover:bg-${color} group-hover:text-white transition-colors duration-300`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-black">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed mb-6">{desc}</p>
    <div className={`flex items-center gap-2 text-sm font-bold text-black group-hover:text-${color} transition-all`}>
      INICIAR SCAN <ChevronRight className={`w-4 h-4 text-${color}`} />
    </div>
  </div>
);

const PricingCard: React.FC<{ tier: string, price: string, features: string[], active?: boolean }> = ({ tier, price, features, active }) => (
    <div className={`relative p-8 rounded-2xl border ${active ? 'border-black bg-black text-white shadow-2xl scale-105' : 'border-gray-200 bg-white text-black hover:border-gray-300'} flex flex-col transition-all duration-300`}>
        {active && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-black border border-black text-xs font-bold rounded-full">POPULAR</div>}
        <h3 className={`text-lg font-bold mb-2 ${active ? 'text-gray-300' : 'text-gray-500'}`}>{tier}</h3>
        <div className="text-4xl font-bold mb-6">{price}<span className={`text-lg font-normal ${active ? 'text-gray-400' : 'text-gray-500'}`}>/mês</span></div>
        <ul className="space-y-4 mb-8 flex-1">
            {features.map((f, i) => (
                <li key={i} className={`flex items-center gap-3 text-sm ${active ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Zap className={`w-4 h-4 ${active ? 'text-white' : 'text-black'}`} /> {f}
                </li>
            ))}
        </ul>
        <button className={`w-full py-3 rounded-lg font-bold transition-all ${active ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>
            Selecionar Plano
        </button>
    </div>
);

const ScannerModal: React.FC<{ 
    type: ScannerType | null, 
    onClose: () => void,
    onScanComplete: (result: ScanResult) => void
}> = ({ type, onClose, onScanComplete }) => {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImage(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const runScan = async () => {
        if (!image || !type) return;
        setLoading(true);
        try {
            const jsonString = await analyzeImage(image, type);
            // Basic cleanup of JSON string if md block is returned
            const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleanJson);
            
            setResult(parsed);
            
            // Create record
            const newScan: ScanResult = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                type: type,
                imageUrl: image,
                summary: parsed.resumo_proposito || parsed.nome_prato || parsed.nome_produto || parsed.dano_detectado || "Resultado do Scan",
                details: parsed
            };
            
            onScanComplete(newScan);

        } catch (e) {
            console.error(e);
            alert("O escaneamento falhou. Por favor, tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (!type) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] shadow-2xl">
                {/* Left: Input */}
                <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col bg-gray-50">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-black flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-black animate-pulse"/>
                            SCANNER {type === 'FOOD' ? 'DE ALIMENTOS' : type === 'VEHICLE' ? 'DE VEÍCULOS' : type === 'DOCUMENT' ? 'DE DOCUMENTOS' : 'DE OBJETOS'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-black"><X className="w-6 h-6"/></button>
                    </div>

                    <div className="flex-1 bg-white rounded-xl border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:border-black transition-colors">
                        {image ? (
                            <img src={image} className="w-full h-full object-contain" alt="Preview" />
                        ) : (
                            <div className="text-center p-8">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-black transition-colors"/>
                                <p className="text-gray-500">Arraste ou Clique para Upload</p>
                                <p className="text-xs text-gray-400 mt-2">Suporte a JPG, PNG</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFile} 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>

                    <div className="mt-6 flex gap-4">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-3 bg-white border border-gray-300 rounded-lg text-black font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Escolher Imagem
                        </button>
                        <button 
                            onClick={runScan}
                            disabled={!image || loading}
                            className={`flex-1 py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all ${!image || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Scan className="w-5 h-5"/>}
                            {loading ? "ANALISANDO..." : "INICIAR SCAN"}
                        </button>
                    </div>
                </div>

                {/* Right: Results */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-white">
                    {result ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-mono flex items-center">
                                <span className="mr-2 font-bold">✓</span> ANÁLISE COMPLETA
                            </div>
                            
                            {Object.entries(result).map(([key, value]) => (
                                <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                                    <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</h4>
                                    <div className="text-black text-lg font-light">
                                        {Array.isArray(value) ? (
                                            <ul className="list-disc list-inside">
                                                {value.map((v: any, i) => <li key={i}>{String(v)}</li>)}
                                            </ul>
                                        ) : (
                                            String(value)
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <Scan className="w-16 h-16 mb-4" />
                            <p>Aguardando Dados...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
    const [page, setPage] = useState('home');
    const [user, setUser] = useState<UserType | null>(null);
    const [activeScanner, setActiveScanner] = useState<ScannerType | null>(null);
    const [history, setHistory] = useState<ScanResult[]>([]);

    const loginDemoUser = () => {
        setUser({
            id: '123',
            name: 'Alex Sterling',
            email: 'alex@escalter.ai',
            tier: 'GOLD',
            credits: 500,
            isAdmin: false
        });
        setPage('dashboard');
    };
    
    const loginAdmin = () => {
        setUser({
             id: '999',
            name: 'Administrador',
            email: 'root@escalter.ai',
            tier: 'GOLD',
            credits: 99999,
            isAdmin: true
        });
        setPage('admin');
    };

    const handleScanComplete = (result: ScanResult) => {
        setHistory([result, ...history]);
    };

    const scanners = [
        { id: 'FOOD', icon: <Utensils/>, title: 'NutriScan', desc: 'Detalhamento instantâneo de calorias e macronutrientes a partir de uma foto da sua refeição.', color: 'green-600' },
        { id: 'VEHICLE', icon: <Car/>, title: 'AutoDano', desc: 'Avaliação de danos via IA, identificação de peças e estimativa de custo de reparo.', color: 'red-600' },
        { id: 'DOCUMENT', icon: <FileText/>, title: 'DocResumo', desc: 'Resumo de documentos legais e comerciais com extração de entidades chave.', color: 'blue-600' },
        { id: 'OBJECT', icon: <ShoppingBag/>, title: 'ItemFinder', desc: 'Identifique objetos, encontre fabricantes e compare preços de mercado instantaneamente.', color: 'purple-600' },
    ];

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            <Navbar 
                user={user} 
                onLogin={loginDemoUser} 
                onLogout={() => { setUser(null); setPage('home'); }} 
                onNavigate={setPage} 
            />
            
            <ScannerModal 
                type={activeScanner} 
                onClose={() => setActiveScanner(null)} 
                onScanComplete={handleScanComplete}
            />

            <main className="pt-16">
                {page === 'home' && (
                    <>
                        <HeroScanner />
                        
                        <div className="relative z-10 -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                            <div className="text-center mb-16">
                                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black">
                                    O Futuro da <span className="text-gray-500">Análise</span>
                                </h1>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                    Desbloqueie o poder da visão computacional. Escaneie qualquer coisa—comida, carros, documentos ou objetos—e obtenha insights profissionais em segundos.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {scanners.map(s => (
                                    <ServiceCard 
                                        key={s.id}
                                        icon={s.icon}
                                        title={s.title}
                                        desc={s.desc}
                                        color={s.color}
                                        onClick={() => {
                                            if (!user) loginDemoUser();
                                            setActiveScanner(s.id as ScannerType);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Professional Data Intelligence Advertising Section */}
                        <div className="bg-gray-50 py-24 border-y border-gray-200 overflow-hidden relative">
                            <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
                                {/* Copy Content */}
                                <div className="lg:w-1/2 z-10">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-bold text-black mb-6 tracking-widest uppercase">
                                        Inteligência Escalter
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black leading-tight">
                                        Transforme Imagens em <br/><span className="text-gray-400">Dados Estratégicos</span>
                                    </h2>
                                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                        O escaneamento é apenas o começo. Nossa IA processa camadas profundas de informação para gerar relatórios detalhados que impulsionam decisões. Seja avaliando o custo de um reparo automotivo ou extraindo cláusulas de contratos complexos, entregamos clareza onde havia apenas pixels.
                                    </p>
                                    
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-black">
                                                <BarChart3 className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-1">Análise Baseada em Dados</h4>
                                                <p className="text-gray-500 text-sm">Converta visualizações subjetivas em métricas objetivas e acionáveis.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-black">
                                                <FileCheck className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-1">Relatórios Instantâneos</h4>
                                                <p className="text-gray-500 text-sm">Receba resumos executivos prontos para exportação em segundos.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={() => setPage('pricing')} className="mt-10 flex items-center gap-2 text-black font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-all">
                                        CONHEÇA NOSSAS SOLUÇÕES <ArrowRight className="w-4 h-4"/>
                                    </button>
                                </div>

                                {/* Animated Data Frame */}
                                <div className="lg:w-1/2 w-full relative">
                                    <div className="relative w-full aspect-square md:aspect-[4/3] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden group">
                                        {/* Background Grid */}
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                                        
                                        {/* Abstract UI Elements */}
                                        <div className="absolute top-8 left-8 right-8 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center px-4 gap-3">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                            <div className="h-2 w-32 bg-gray-200 rounded-full ml-4"></div>
                                        </div>

                                        {/* Scanning Animation */}
                                        <div className="absolute top-28 left-8 w-1/3 h-48 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Scan className="w-12 h-12"/>
                                            </div>
                                            {/* Scan Line */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-black shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-[scan_3s_ease-in-out_infinite]"></div>
                                        </div>

                                        {/* Connecting Lines */}
                                        <svg className="absolute top-28 left-[calc(33%+32px)] w-[20%] h-48 z-0" style={{overflow: 'visible'}}>
                                            <path d="M 0 24 H 40 C 60 24, 60 24, 80 40 L 100 60" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]"/>
                                            <path d="M 0 100 H 40" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_1.5s_linear_infinite]"/>
                                            <path d="M 0 180 H 40 C 60 180, 60 180, 80 160 L 100 140" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_1.2s_linear_infinite]"/>
                                        </svg>

                                        {/* Data Output Cards (Right Side) */}
                                        <div className="absolute top-28 right-8 w-[40%] space-y-3">
                                            {/* Card 1 - Graph */}
                                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm translate-x-full animate-[slideIn_0.5s_ease-out_forwards_0.5s]">
                                                <div className="flex items-end gap-1 h-12">
                                                    <div className="w-1/5 bg-gray-100 h-[40%] rounded-t-sm"></div>
                                                    <div className="w-1/5 bg-gray-200 h-[70%] rounded-t-sm"></div>
                                                    <div className="w-1/5 bg-black h-[50%] rounded-t-sm"></div>
                                                    <div className="w-1/5 bg-gray-300 h-[80%] rounded-t-sm"></div>
                                                    <div className="w-1/5 bg-gray-100 h-[60%] rounded-t-sm"></div>
                                                </div>
                                            </div>
                                            {/* Card 2 - Text */}
                                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm translate-x-full animate-[slideIn_0.5s_ease-out_forwards_0.8s]">
                                                <div className="h-2 w-3/4 bg-black rounded-full mb-2"></div>
                                                <div className="h-2 w-1/2 bg-gray-200 rounded-full"></div>
                                            </div>
                                            {/* Card 3 - Pie */}
                                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm translate-x-full animate-[slideIn_0.5s_ease-out_forwards_1.1s] flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-black border-r-black rotate-45"></div>
                                                <div className="space-y-1">
                                                    <div className="h-1.5 w-12 bg-gray-300 rounded-full"></div>
                                                    <div className="h-1.5 w-8 bg-gray-100 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custom Styles for Animation */}
                                        <style>{`
                                            @keyframes scan {
                                                0%, 100% { top: 0%; opacity: 0; }
                                                10% { opacity: 1; }
                                                90% { opacity: 1; }
                                                100% { top: 100%; opacity: 0; }
                                            }
                                            @keyframes slideIn {
                                                to { transform: translateX(0); }
                                            }
                                            @keyframes dash {
                                                to { stroke-dashoffset: -20; }
                                            }
                                        `}</style>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {page === 'pricing' && (
                    <div className="max-w-7xl mx-auto px-4 py-20">
                         <h2 className="text-4xl font-bold text-center mb-16">Escolha seu <span className="text-gray-500">Poder</span></h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <PricingCard tier="GRÁTIS" price="R$0" features={["5 Scans/Mês", "Resolução Básica", "Suporte da Comunidade", "Com Anúncios"]} />
                             <PricingCard tier="PRATA" price="R$49" features={["100 Scans/Mês", "Análise HD", "Suporte por Email", "Histórico (30 Dias)"]} />
                             <PricingCard tier="OURO" price="R$199" features={["Scans Ilimitados", "Análise 4K", "Suporte Prioritário 24/7", "Acesso à API", "Exportar para PDF"]} active />
                         </div>
                    </div>
                )}

                {(page === 'dashboard' || page === 'scanners') && user && (
                    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
                        {/* Sidebar */}
                        <div className="w-full md:w-64 space-y-2">
                             <div className="p-6 bg-white rounded-2xl border border-gray-200 mb-6 shadow-sm">
                                 <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-200 to-gray-400 mb-4 mx-auto"/>
                                 <h3 className="text-center font-bold text-lg text-black">{user.name}</h3>
                                 <div className="text-center text-xs text-black border border-black rounded-full py-1 mt-2 inline-block w-full">MEMBRO {user.tier === 'GOLD' ? 'OURO' : 'PRATA'}</div>
                             </div>
                             
                             <button onClick={() => setPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${page === 'dashboard' ? 'bg-black text-white' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}>
                                 <LayoutDashboard className="w-5 h-5"/> Dashboard
                             </button>
                             <button onClick={() => setPage('scanners')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${page === 'scanners' ? 'bg-black text-white' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}>
                                 <Scan className="w-5 h-5"/> Novo Scan
                             </button>
                             <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition-all">
                                 <History className="w-5 h-5"/> Histórico de Scans
                             </button>
                             <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition-all">
                                 <MessageSquare className="w-5 h-5"/> Suporte
                             </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            {page === 'dashboard' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                            <div className="text-gray-500 text-sm mb-1">Total de Scans</div>
                                            <div className="text-3xl font-bold text-black">{history.length + 124}</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                            <div className="text-gray-500 text-sm mb-1">Horas Economizadas</div>
                                            <div className="text-3xl font-bold text-black">14.2</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                            <div className="text-gray-500 text-sm mb-1">Créditos Restantes</div>
                                            <div className="text-3xl font-bold text-black">{user.credits}</div>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-black">Atividade Recente</h2>
                                    <div className="space-y-4">
                                        {history.length === 0 && (
                                            <div className="text-center py-12 text-gray-400 border border-dashed border-gray-300 rounded-2xl bg-gray-50">
                                                Nenhum scan recente nesta sessão.
                                            </div>
                                        )}
                                        {history.map(scan => (
                                            <div key={scan.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-black transition-all shadow-sm">
                                                <img src={scan.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt="Scan" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-black border border-gray-200">
                                                            {scan.type === 'FOOD' ? 'ALIMENTO' : scan.type === 'VEHICLE' ? 'VEÍCULO' : scan.type === 'DOCUMENT' ? 'DOCUMENTO' : 'OBJETO'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{new Date(scan.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="font-bold text-black mt-1">{scan.summary}</h4>
                                                </div>
                                                <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5 text-gray-400"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {page === 'scanners' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {scanners.map(s => (
                                        <ServiceCard 
                                            key={s.id} 
                                            icon={s.icon} 
                                            title={s.title} 
                                            desc={s.desc} 
                                            color={s.color} 
                                            onClick={() => setActiveScanner(s.id as ScannerType)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {page === 'admin' && user && user.isAdmin && (
                    <div className="max-w-7xl mx-auto px-4 py-12">
                        <div className="flex items-center justify-between mb-8">
                             <h2 className="text-3xl font-bold text-black">Painel de <span className="text-gray-500">Comando Admin</span></h2>
                             <button onClick={loginDemoUser} className="text-sm text-gray-500 hover:text-black underline">Mudar para Visão de Usuário</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                     <User className="text-black"/>
                                     <span className="text-green-600 text-xs font-bold">+12%</span>
                                 </div>
                                 <div className="text-3xl font-bold text-black">14,203</div>
                                 <div className="text-gray-500 text-sm">Usuários Ativos</div>
                             </div>
                             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                     <DollarSign className="text-green-600"/>
                                     <span className="text-green-600 text-xs font-bold">+8%</span>
                                 </div>
                                 <div className="text-3xl font-bold text-black">R$84,392</div>
                                 <div className="text-gray-500 text-sm">Receita Mensal</div>
                             </div>
                             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                     <Scan className="text-purple-600"/>
                                     <span className="text-green-600 text-xs font-bold">+24%</span>
                                 </div>
                                 <div className="text-3xl font-bold text-black">1.2M</div>
                                 <div className="text-gray-500 text-sm">Total de Scans</div>
                             </div>
                             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                     <MessageSquare className="text-yellow-500"/>
                                     <span className="text-red-500 text-xs font-bold">14 Pendentes</span>
                                 </div>
                                 <div className="text-3xl font-bold text-black">98%</div>
                                 <div className="text-gray-500 text-sm">Taxa de Resolução</div>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                 <h3 className="font-bold mb-6 flex items-center gap-2 text-black"><DollarSign className="w-4 h-4"/> Visão Geral Financeira</h3>
                                 <div className="space-y-4">
                                     <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                         <span className="text-gray-700">Assinaturas Ouro</span>
                                         <span className="font-mono text-black font-bold">R$42,000</span>
                                     </div>
                                     <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                         <span className="text-gray-700">Assinaturas Prata</span>
                                         <span className="font-mono text-black font-bold">R$28,500</span>
                                     </div>
                                     <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                         <span className="text-gray-700">Taxas de Uso da API</span>
                                         <span className="font-mono text-black font-bold">R$13,892</span>
                                     </div>
                                 </div>
                             </div>

                             <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                 <h3 className="font-bold mb-6 flex items-center gap-2 text-black"><Shield className="w-4 h-4"/> Chamados de Suporte Recentes</h3>
                                 <div className="space-y-4">
                                     {[1,2,3].map(i => (
                                         <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-2 h-2 rounded-full bg-yellow-500"/>
                                                 <div className="text-sm">
                                                     <div className="text-black font-bold">Problema de Cobrança #{2030 + i}</div>
                                                     <div className="text-gray-500">Usuário: user_{i}99</div>
                                                 </div>
                                             </div>
                                             <button className="text-xs px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 text-black">Resolver</button>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Professional Footer */}
            <footer className="bg-white border-t border-gray-200 pt-16 pb-8 text-black">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                  {/* Brand Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
                         <Scan className="w-5 h-5 text-white" />
                       </div>
                       <span className="text-xl font-bold tracking-wider text-black">ESCA<span className="text-gray-500">LTER</span></span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Transformando o desconhecido em dados acionáveis através de visão computacional de última geração. O padrão ouro em inteligência de escaneamento.
                    </p>
                    <div className="flex gap-4">
                       <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-black hover:text-white transition-all text-gray-500">
                         <Twitter className="w-5 h-5" />
                       </a>
                       <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-black hover:text-white transition-all text-gray-500">
                         <Linkedin className="w-5 h-5" />
                       </a>
                       <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-black hover:text-white transition-all text-gray-500">
                         <Github className="w-5 h-5" />
                       </a>
                    </div>
                  </div>

                  {/* Links Columns */}
                  <div>
                    <h4 className="font-bold text-black mb-6 text-sm uppercase tracking-widest">Produto</h4>
                    <ul className="space-y-4 text-sm text-gray-500">
                       <li><a href="#" className="hover:text-black transition-colors">Scanners de IA</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Preços & Planos</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">API para Desenvolvedores</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Casos de Uso</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Integrações</a></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-black mb-6 text-sm uppercase tracking-widest">Empresa</h4>
                    <ul className="space-y-4 text-sm text-gray-500">
                       <li><a href="#" className="hover:text-black transition-colors">Sobre Nós</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Carreiras</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Blog</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Imprensa</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Contato</a></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-black mb-6 text-sm uppercase tracking-widest">Legal & Suporte</h4>
                    <ul className="space-y-4 text-sm text-gray-500">
                       <li><a href="#" className="hover:text-black transition-colors">Termos de Serviço</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Política de Privacidade</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Política de Cookies</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Central de Ajuda</a></li>
                       <li><a href="#" className="hover:text-black transition-colors">Status do Sistema</a></li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                   <p className="text-sm text-gray-400">&copy; 2024 Escalter Intelligence Inc. Todos os direitos reservados.</p>
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                         <span className="font-bold text-xs uppercase tracking-wider">ESCALTER PRO</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Globe className="w-4 h-4" />
                        <span>Português (BR)</span>
                      </div>
                   </div>
                </div>
              </div>
            </footer>
        </div>
    );
};

export default App;