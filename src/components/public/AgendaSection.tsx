import React from 'react';
import { AgendaItem } from '../../types';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';

interface AgendaSectionProps {
  agendas: AgendaItem[];
}

export const AgendaSection: React.FC<AgendaSectionProps> = ({ agendas }) => {
  const visibleAgendas = (agendas || []).filter((item) => item.isVisible !== false);

  return (
    <section id="agenda" className="py-16 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda Akademik &amp; Kesiswaan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Jadwal Kegiatan &amp; Acara Mendatang
          </h2>
          <p className="text-slate-500 text-sm sm:text-base">
            Catat tanggal-tanggal krusial untuk kegiatan belajar mengajar, penilaian, serta acara perayaan sekolah.
          </p>
        </div>

        {/* Agendas List */}
        {visibleAgendas.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-200 max-w-lg mx-auto">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-semibold text-sm">Belum ada agenda publik yang ditampilkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleAgendas.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 rounded-2xl p-6 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md shadow-2xs">
                    <Tag className="w-3 h-3 text-blue-600" />
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded">
                    Mendatang
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug mb-4">
                  {item.title}
                </h3>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200/60 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

      </div>
    </section>
  );
};
