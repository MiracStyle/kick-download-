import React from 'react';
import { HelpCircle, Check, Smartphone, Monitor, ShieldCheck, Zap, Download } from 'lucide-react';

export const FaqView: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Kick Klip Linkini Kopyalayın',
      desc: 'Kick.com üzerinde izlediğiniz klibin sağındaki "Paylaş" butonuna basın veya tarayıcınızın adres çubuğundaki linki kopyalayın.',
      icon: Monitor,
    },
    {
      num: '2',
      title: 'İndirici Kutusuna Yapıştırın',
      desc: 'Uygulamamızdaki arama kutusuna linki yapıştırın ve "Klibi Getir" butonuna tıklayın.',
      icon: Zap,
    },
    {
      num: '3',
      title: 'Kalite Seçin veya Kırpın',
      desc: '1080p, 720p veya MP3 ses formatını seçin. İsterseniz kırpıcı aracıyla sadece istediğiniz saniyeleri belirleyin.',
      icon: Download,
    },
    {
      num: '4',
      title: 'Anında Cihazınıza İndirin',
      desc: '"İndir" butonuna bastığınızda video doğrudan cihazınıza filigransız olarak inecektir.',
      icon: Check,
    },
  ];

  const faqs = [
    {
      q: 'İndirilen videolarda filigran (watermark) veya logo bulunuyor mu?',
      a: 'Kesinlikle hayır! İndirilen tüm videolar ve sesler Kick sunucularındaki orijinal kaynak dosyalardan doğrudan alınır ve herhangi bir logo, filigran veya reklam eklenmez.',
    },
    {
      q: 'Hangi URL formatlarını destekliyorsunuz?',
      a: 'Uygulamamız Kick.com üzerindeki tüm klip formatlarını tanır:\n• kick.com/kanal_adi?clip=clip_01...\n• kick.com/clips/clip_01...\n• kick.com/clip/clip_01...\n• clip_01... (yalnızca klip kodu)',
    },
    {
      q: 'Videoyu iPhone (iOS) veya Android telefonuma nasıl indirebilirim?',
      a: 'İndirme seçeneklerinde bulunan "Telefonda İndir" butonuna tıklayıp ekrandaki QR kodu telefon kameranızla taratarak klibi doğrudan telefonunuza indirebilirsiniz. Ayrıca mobil tarayıcınızda da sitemiz 100% uyumludur.',
    },
    {
      q: 'Videoyu kırpıp sadece belirli bir bölümünü indirebilir miyim?',
      a: 'Evet! Gelişmiş "Klip Kırpıcı" aracımız sayesinde klibin istediğiniz başlangıç ve bitiş saniyelerini belirleyerek tam istediğiniz eğlenceli anı hızlıca indirebilirsiniz.',
    },
    {
      q: 'Klipleri MP3 ses olarak kaydedebilir miyim?',
      a: 'Evet! İndirme seçeneklerinden "MP3 Ses Dosyası"nı seçtiğinizde sunucumuz klibin sesini 192 kbps stüdyo kalitesinde MP3 olarak ayıklar ve indirir.',
    },
    {
      q: 'Tüm Kick canlı yayınını (VOD / Geçmiş Yayın) indirebilir miyim?',
      a: 'Evet! "Tüm Yayın (VOD)" sekmemizden veya arama kutusuna herhangi bir Kick yayın linki (örn: kick.com/video/... veya kanal adı kick.com/xqc) yapıştırarak 10 saate varan tüm yayını 1080p, 720p veya MP3 olarak indirebilir; isterseniz başlangıç ve bitiş dakikalarını belirterek sadece istediğiniz bölümü cihazınıza kaydedebilirsiniz.',
    },
    {
      q: 'Bu hizmet tamamen ücretsiz mi?',
      a: 'Evet! Herhangi bir kayıt, üyelik veya ücret talep edilmez. Sınırsız sayıda klip ve yayın indirebilirsiniz.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18] text-xs font-extrabold uppercase">
          <HelpCircle className="w-4 h-4" />
          Kullanım Rehberi & SSS
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Kick Klipleri Nasıl İndirilir?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Adım adım Kick yayıncı kliplerini bilgisayarınıza veya telefonunuza nasıl kaydedeceğinizi öğrenin.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.num}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-xl bg-[#53fc18] text-black font-extrabold text-sm flex items-center justify-center">
                    {st.num}
                  </span>
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">{st.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Accordion / Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white mb-2">Sıkça Sorulan Sorular</h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md"
            >
              <h4 className="text-sm font-bold text-white mb-2 flex items-start gap-2.5">
                <span className="text-[#53fc18] font-mono font-bold">Q.</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed pl-6 whitespace-pre-line">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
