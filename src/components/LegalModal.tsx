import React, { useState } from 'react';
import {
  ShieldAlert,
  FileText,
  Lock,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  Mail,
  HeartHandshake,
  Server,
  FileCheck,
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'disclaimer' | 'dmca' | 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'disclaimer',
}) => {
  const [activeTab, setActiveTab] = useState<'disclaimer' | 'dmca' | 'terms' | 'privacy'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e141f] border border-white/15 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center text-[#53fc18]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Yasal Haklar & Sorumluluk Reddi
              </h3>
              <p className="text-xs text-slate-400">
                Bağımsız Hayran Yapımı Proje & Telif Hakları Politikası
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-black/20 border-b border-white/5 px-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'bg-[#53fc18] text-black shadow-md shadow-[#53fc18]/20 font-black'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Hayran Yapımı Bildirimi</span>
          </button>

          <button
            onClick={() => setActiveTab('dmca')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dmca'
                ? 'bg-[#53fc18] text-black shadow-md shadow-[#53fc18]/20 font-black'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Telif & DMCA Kaldırma</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#53fc18] text-black shadow-md shadow-[#53fc18]/20 font-black'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kullanım Şartları</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#53fc18] text-black shadow-md shadow-[#53fc18]/20 font-black'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Çerez & Gizlilik</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          {/* Tab 1: Fan-Made Disclaimer */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-[#53fc18]/10 border border-[#53fc18]/30 flex items-start gap-3 text-white">
                <HeartHandshake className="w-6 h-6 text-[#53fc18] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-[#53fc18]">
                    100% Bağımsız ve Gayri Resmi Hayran Projesi (Unofficial Fan-made Tool)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bu web sitesi, Kick yayıncılık platformunu seven yayın takipçileri ve topluluk üyeleri için geliştirilmiş <strong>ücretsiz, bağımsız ve gayri resmi</strong> bir yardımcı araçtır.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#53fc18]" />
                  Marka ve İştirak Açıklaması
                </h5>
                <p>
                  "Kick", "Kick.com" marka ismi, logosu ve tüm görsel hakları <strong>Easygo Entertainment Ltd.</strong> ve ilgili hak sahiplerine aittir. Bu web sitesinin Kick platformu veya şirket yönetimi ile hiçbir resmi bağı, ortaklığı, sponsorluğu, lisans anlaşması veya ticari temsilciliği bulunmamaktadır.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#53fc18]" />
                  Sunucu ve İçerik Saklamama Garantisi
                </h5>
                <p>
                  Sitemiz <strong>kesinlikle video barındırma (hosting) sunucusu DEĞİLDİR</strong>. Sunucularımızda hiçbir video, klip veya yayın dosyası depolanmaz, kaydedilmez veya saklanmaz. Araç, yalnızca kullanıcının girdiği açık bağlantılar üzerinden yayıncıların herkese açık yayın akışlarına yönlendirme yapar.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">Sorumluluk Sınırı</span>
                  İndirilen tüm materyallerin kullanımı tamamen kullanıcının kendi sorumluluğundadır. Üçüncü şahısların telif hakkına konu içeriklerinin izinsiz ticari kullanımı yasaktır.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Copyright & DMCA */}
          {activeTab === 'dmca' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-200">
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">Telif Hakları (DMCA) & İçerik Bildirim Politikası</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sitemiz başkalarının fikri mülkiyet haklarına ve telif yasalarına (DMCA / 5651 Sayılı Kanun) tam saygı gösterir.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-white text-sm">Telif Hakkı Sahipleri İçin Bilgilendirme</h5>
                <p>
                  Sitemiz bir arama ve köprü sağlama aracı olarak çalışır. Sitemiz üzerinden indirilen veya görüntülenen hiçbir medya içerik sunucularımızda tutulmadığı için, asıl içerik Kick.com platformu sunucularında yer almaktadır. Yine de telif hakkı sahibi veya yetkili temsilcisi olarak sitemizdeki araçların belirli bir içeriğe erişimini engellemesini istiyorsanız, bize doğrudan bildirimde bulunabilirsiniz.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#53fc18]" />
                  DMCA / İletişim E-Posta Adresi:
                </h5>
                <a
                  href="mailto:memre8151@gmail.com"
                  className="inline-block font-mono text-[#53fc18] hover:underline font-bold text-sm"
                >
                  memre8151@gmail.com
                </a>
                <p className="text-[11px] text-slate-400">
                  Bildiriminizde ilgili video URL'si ve hak sahipliği belgenizin eklenmesi inceleme sürecini hızlandıracaktır. Talepler 24-48 saat içinde değerlendirilir.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Terms of Service */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#53fc18]" />
                Kullanım Hizmet Şartları
              </h4>

              <ol className="list-decimal list-inside space-y-3 text-slate-300">
                <li>
                  <strong className="text-white">Kişisel Kullanım Amacı:</strong> Bu aracı yalnızca kişisel arşivleme, çevrimdışı izleme veya eğitim/analiz amacıyla kullanmayı kabul etmektesiniz.
                </li>
                <li>
                  <strong className="text-white">Yasal Uyumluluk:</strong> İndirilen içeriklerin üçüncü şahıslara satılması, ticari amaçla dağıtılması veya izinsiz yayınlanması yasaktır.
                </li>
                <li>
                  <strong className="text-white">Hizmet Garantisi:</strong> Bu ücretsiz servis "olduğu gibi" (as-is) sunulur. Kesintisiz veya hatasız çalışma garantisi verilmez.
                </li>
                <li>
                  <strong className="text-white">Değişiklik Hakları:</strong> Hizmet şartları ve site içeriği önceden bildirimde bulunulmaksızın güncellenebilir.
                </li>
              </ol>
            </div>
          )}

          {/* Tab 4: Privacy & Cookies */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#53fc18]" />
                Gizlilik & Çerez Politikası
              </h4>

              <p>
                Kullanıcı gizliliği sitemiz için birinci derecede önemlidir. Kişisel verilerinizin nasıl işlendiği aşağıda özetlenmiştir:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#53fc18]" />
                    Üyelik Gerektirmez
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sitemizi kullanmak için hesap açmanız veya e-posta adresi vermeniz gerekmez.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#53fc18]" />
                    Yerel Depolama (LocalStorage)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    İndirme geçmişiniz ve kuyruğunuz yalnızca kendi cihazınızın tarayıcısında saklanır.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-[#53fc18]" />
            <span>Kişisel Verilerin Korunması (KVKK & GDPR) Uyumlu</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#53fc18] hover:bg-[#43d412] text-black font-extrabold text-xs shadow-md shadow-[#53fc18]/20 transition-all cursor-pointer"
          >
            Anladım & Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
