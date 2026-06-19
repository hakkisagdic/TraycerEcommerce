# LLM Council Transcript — GSU-5 (Post Revision History & Autosave)

**Timestamp:** 2026-05-08 13:26:59
**Counciled topic:** Linear issue **GSU-5** — solo geliştirici, Next.js 16 + Prisma SQLite + Tiptap blog CMS'inde "Post Revision History & Autosave" feature'ını şimdi mi, spec'teki gibi mi implemente etmeli?

---

## Original Question
"Lineardeki işlerden rastgele birini alarak devam et." → GSU-5 seçildi.

## Framed Question
Solo geliştirici, **Traycer Blog CMS** projesinde (Next.js 16 + Prisma **SQLite** + NextAuth + Tiptap) Linear issue **GSU-5'i** implemente etmek istiyor.

**Spec:** `PostRevision` modeli (full content snapshot), debounced 5 sn `POST /api/posts/:id/autosave`, list + restore endpoint'leri, Tiptap autosave hook'u, "Saved Xs ago" göstergesi, `diff-match-patch` ile diff görünümü, son 50 revizyon retention. Must-Have / Medium / High priority.

**Mevcut durum:** SQLite (GSU-2 ile Postgres geçişi planlı). Background job runner yok. Tiptap kurulu. Solo geliştirici, ders projesi olarak büyüyen CMS.

**Pressure-test:**
1. SQLite + 5sn full snapshot doğru tasarım mı, yoksa GSU-2 önce mi?
2. Sadece debounce yeterli mi (multi-tab/conflict)?
3. "Son 50 revizyon" mantıklı mı?
4. Diff drawer + "Saved" göstergesi scope creep mi?

---

## Advisor Responses

### The Contrarian
SQLite + her 5sn full snapshot = yazma kuyruğu bombası. SQLite tek yazıcılı (write lock), WAL açık olsa bile commit serileştirilir. 50KB post × 50 revizyon = 2.5MB index'siz blob. Postgres'e geçişten (GSU-2) önce yazmak migration'ı zorlaştırır.

Sadece debounce KESİNLİKLE yetmez. Debounce + offline detection + idempotency key + son snapshot ile content-hash diff (no-op skip) lazım. Aksi halde boşluk-tuşu/geri-sil gibi noise her 5sn'de bir aynı içeriğin kopyasını yazar — 50 revizyon limiti 10 dakikada dolar.

"Son 50" sayı bazlı retention saçma. Solo proje, ders. 50 revizyon belki 4 dakikalık yazma. Zaman bazlı (son 24 saat) + milestone bazlı (manuel save) hibrit olmalı.

Diff-match-patch + drawer + "Saved Xs ago" → scope creep. v1 = sadece autosave + list + restore.

**Önerim:** GSU-5'i ERTELE. Önce GSU-2 (Postgres). Sonra autosave'i content-hash diff + zaman bazlı retention ile, snapshot yerine değişiklik varsa yaz. Şimdi yaparsan iki kez yazacaksın.

### The First Principles Thinker
Bu özelliğin gerçek "iş tanımı" nedir? Kullanıcı revizyon istemiyor — **"yazımı kaybetmeme güvencesi"** istiyor. Spec çözümü problemin yerine koymuş.

Solo dev, ders projesi, tek yazar, eşzamanlı düzenleme yok, audit/compliance yok, "şubat 3'teki versiyona dön" senaryosu pratikte kaç kez olur? Muhtemelen sıfır. PostRevision'ın değerinin %90'ı tek senaryoda yatıyor: tarayıcı çöktü / sekme kapandı / internet gitti.

Bu senaryonun çözümü revizyon tablosu değil — `localStorage`. Tiptap içeriğini her keystroke'ta (debounce 500ms) localStorage'a yaz, sayfa açıldığında "kaydedilmemiş taslağın var, geri yükleyeyim mi?" sor. Sıfır backend, sıfır migration, sıfır retention politikası, sıfır diff kütüphanesi.

**Cevaplar:**
1. SQLite + 5sn snapshot → yanlış soru.
2. Debounce yetmez çünkü yanlış katmanda — istemci tarafında olmalı.
3. "50 revizyon" uydurma sayı, hangi soruya cevap belirsiz.
4. Diff drawer net scope creep.

**Önerim:** İkiye böl. **Faz 1 (2 saat):** localStorage taslak + "Saved Xs ago" indikatörü. Bu kayıp-yazı korkusunun %95'ini çözer. **Faz 2 (gerçek bir kullanıcı talep ederse):** PostRevision. Şu an inşa etmek YAGNI.

Doğru soru: "Kullanıcı yazısını ne zaman, nasıl kaybediyor?"

### The Expansionist
Hidden upside: revision history yedekleme değil, **yapısal veri altın madeni**. Hiçbir CMS'te olmayan bir veri katmanı.

1. **AI-assisted writing'in temel taşı.** PostRevision + diff = "yazar bu paragrafı 7 kez yeniden yazdı, hangisi en iyisi?" sorusunu cevaplayan corpus. Claude'a "son 5 revizyondan yazarın gerçek niyetini bul ve cilala" dedirtir.
2. **"Writing Replay" — kimsenin yapmadığı.** Tiptap + 50 snapshot ile yazının evrimini timeline olarak oynat. Substack/Ghost/Medium'da yok. Ders projesi sunumunda jüriyi devirir.
3. **Audit trail başlı başına SaaS.** Kurumsal blog/legal/medical compliance için.
4. **Collaborative editing'in %80'i.** PostRevision + diff-match-patch elinde varsa OT/CRDT'ye geçiş ufak.

**Spec'i genişlet:** Revision'a `userId`, `wordCount`, `editDurationMs`, opsiyonel `aiAssisted` alanları ekle. "Compare with AI suggestion" butonu. 50 retention'ı milestone tabanlı pruning yap.

5 saniyelik autosave bir feature değil, **yazı sürecinin event stream'i**. Spec'i bu gözle yeniden oku.

### The Outsider
Kapıdan yeni girdim, kafam karıştı. "PostRevision modeli", "debounced 5sn", "diff-match-patch" — geliştirici dili. Asıl soru: bu CMS'i kim kullanıyor?

Yazar insanlar "iki versiyon arasındaki farkı kırmızı-yeşil renklerle görmek" istemez. Onlar "yanlışlıkla sildiğim paragrafı geri alabileyim" ister. Bunlar aynı şey değil.

Sormadığın soru: "Kullanıcılarım gerçekten iş kaybediyor mu?" Solo projede günde 2-5 post. Ayda bir "yazım gitti" oluyorsa çözüm 50 satır localStorage taslak.

**Curse of knowledge:** "Saved Xs ago" Google Docs reflex'i — orada 50 kişi aynı anda yazıyor. Senin CMS'inde tek yazar var. Bu gösterge psikolojik konfor sağlar ama 50 revizyonluk altyapı gerektirmez.

**Önerim:** GSU-5'i ikiye böl. localStorage taslak + basit indikatör (1 gün). 1 ay kullan. "Keşke eski versiyona dönseydim" oldu mu — o zaman PostRevision. Olmadıysa başka şeye geç. Spec şu an over-engineering kokuyor.

### The Executor
**Pazartesi sabahı v0 — 4 saat:**

**C1 — Schema (20dk):**
```prisma
model PostRevision {
  id        String   @id @default(cuid())
  postId    String
  content   String
  title     String
  createdAt DateTime @default(now())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([postId, createdAt])
}
```
`prisma migrate dev --name add_post_revision`. SQLite + 5sn paniği teorik — solo dev, eşzamanlı yazar yok, WAL yeter.

**C2 — Endpoint (45dk):** `app/api/posts/[id]/autosave/route.ts` — auth, `prisma.postRevision.create()`, raw `DELETE WHERE id NOT IN (SELECT id ... LIMIT 50)`. GET list aynı dosyada.

**C3 — Hook (1 saat):** `hooks/useAutosave.ts` — `lodash.debounce` 5sn yerine **10sn**. `lastSavedAt` state.

**C4 — İndikatör (30dk):** Toolbar'a `formatDistanceToNow` span.

**Kesilenler:** Diff drawer SONRA. Ayrı restore endpoint'i SONRA — v0'da revision GET → editor'e set → normal save. Manuel "Save now" — debounce yeter.

**Toplam:** ~2.5 saat kod + 1 saat test. Ders projesi için fazlasıyla yeter.

---

## Anonymization Mapping (post-review revealed)
- **Response A** = The Outsider
- **Response B** = The Contrarian
- **Response C** = The Executor
- **Response D** = The First Principles Thinker
- **Response E** = The Expansionist

## Peer Reviews

### Reviewer 1
**En güçlü: D.** Soruyu doğru çerçeveliyor: spec çözümü problemin yerine koymuş. Solo dev, tek yazar — gerçek risk "tarayıcı çöktü, yazım gitti." localStorage + 2 saat = riskin %90'ını kapatır. YAGNI net, faz 2 tetikleyicisi açık. A da iyi ama dağınık; D operasyonel.

**En büyük blind spot: E.** "AI corpus, writing replay, enterprise audit, CRDT'ye köprü" — solo bir ders/blog projesinde sıfır kullanıcısı olan feature'a roadmap yazıyor. Hidden upside gerçek ama önkoşul yok. Fırsat maliyeti ve "kim için" sorusu eksik.

**Hepsinin kaçırdığı:** **Tiptap zaten history (undo/redo) tutuyor** — in-memory ama oturum içi "yanlışlıkla sildim" senaryosunun büyük kısmını çözer. Asıl boşluk sadece **sayfa kapanışı/çökme**. Ayrıca kimse GSU-5'in diğer GSU'larla bağımlılığını sormadı (B sadece GSU-2'ye değindi). Bir de **rubric/teslim tarihi** — ders projesiyse jüri kriteri "çalışan revision" mı yoksa "temiz MVP" mi?

### Reviewer 2
**En güçlü: D (First Principles).** "Yazı kaybetmeme güvencesi" gerçek ihtiyacı doğru izole ediyor. Solo dev + SQLite + tek kullanıcı bağlamında localStorage + kısa debounce, PostRevision tablosundan önce gelmeli. Ship-edilebilir, geri-alınamaz değil; spec'i savunma değil, kullanıcı problemini çözüyor.

**En büyük blind spot: E (Expansionist).** "Revision = altın maden" romantizmi solo dev gerçekliğini ıskalıyor. AI-assisted, Writing Replay, collab — hiçbiri roadmap'te yok, kullanıcı yok, retention/PII sorunu yok. userId/wordCount/aiAssisted ekleyerek 4 saatlik işi 2 güne çeviriyor; YAGNI'nin tam tersi.

**Hepsinin kaçırdığı:** Tiptap'in zaten **in-memory undo/redo history**'si var. Asıl risk "tab kapanırsa son 30 saniye uçar" — `beforeunload` + localStorage snapshot ile çözülür, ne PostRevision ne debounced API gerekir. Ayrıca: **Next.js 16 + Prisma SQLite dev ortamında yazma kilidi + HMR + autosave kombinasyonu** dev'de patlar. Ve en önemlisi: GSU-5'i şimdi yapmamak da bir karar değil — **issue'yu kapatıp localStorage taslağıyla değiştirmek lazım**, "ertele" demek backlog çürütür.

### Reviewer 3
**En güçlü: D.** JTBD'yi doğru tanımlıyor. Solo dev, ayda 5 post — PostRevision + diff drawer + 50 retention klasik over-engineering. localStorage + "taslağın var" prompt'u 2 saatte gerçek problemi çözer. C iyi executor ama spec'i sorgulamadan koda geçiyor; D önce "doğru şeyi mi yapıyoruz" diye soruyor.

**En büyük blind spot: E.** Solo geliştirici, ayda 2-5 post. "AI corpus", "Writing Replay timeline", "audit trail SaaS" — kullanıcı yokken ürün hayali. wordCount/editDurationMs/aiAssisted alanları, hiç kullanılmayacak şema borcu.

**Hepsinin kaçırdığı:** Tiptap'in **kendi `history` extension'ı var** (undo/redo stack zaten in-memory) ve **Y.js/collaboration-history** ile snapshot built-in. "Kayıp paragraf geri al" problemi editor seviyesinde büyük ölçüde çözülmüş — sadece sayfa kapanırsa kaybolur. Gerçek çözüm: Tiptap history + `beforeunload` + localStorage persist. Hiçbir cevap **mevcut araçların kapasitesini incelemedi**; herkes ya yeni tablo (A hariç) ya yeni hook tasarladı. Build vs. buy/use değil — **vs. zaten-var** sorgusu eksik.

---

## Chairman Synthesis

### Where the Council Agrees
- **Spec'teki haliyle GSU-5 over-engineered.** 5/5 advisor (Expansionist dahil — o "genişlet" diyor, ama "spec'teki 50-snapshot retention'ı doğru" demiyor) bir noktada spec'in mevcut formuna itiraz ediyor.
- **Diff drawer + "Saved Xs ago" + restore endpoint v0 için scope creep.** Contrarian, First Principles, Outsider, Executor net olarak kesin diyor.
- **Gerçek problem "kayıp yazı korkusu", revision arşivciliği değil.** First Principles, Outsider, Reviewer 1-3 hepsi aynı tespiti yapıyor.
- **Solo dev + tek yazar bağlamında server-side revision tablosunun marjinal değeri çok düşük.** Contrarian + First Principles + Outsider + 3 peer review konsensüsü.

### Where the Council Clashes
- **PostRevision tablosu hiç gerekmez (D, A) vs. minimum şemayla şimdi yapılır (C) vs. genişletilerek yapılır (E).** First Principles "tabloyu hiç yazma — localStorage yeter" derken Executor "20 dakikalık schema'yla zaten halledilir" diyor. Çatışma değer/maliyet eğrisinde: Executor 2.5 saatlik maliyeti hesaplıyor, First Principles bu 2.5 saati başka GSU'ya ayırmayı tercih ediyor.
- **GSU-2 önce mi (Contrarian) yoksa GSU-5 SQLite üstünde rahatlıkla yapılır mı (Executor)?** Contrarian write-lock paniğini büyütüyor; Executor solo dev senaryosunda WAL'in yeterli olduğunu söylüyor. Reviewer 2 Contrarian'a yarı destek veriyor (HMR + dev mode'da patlar).
- **Genişlet (E) vs. küçült (D).** Expansionist çıkışı, peer review'da en zayıf bulunan cevap; üç review da E'yi blind-spot olarak işaretledi. Yine de uzun vadeli vizyonu kayda değer — sadece bu sprint'in işi değil.

### Blind Spots the Council Caught (Peer Review'dan Çıkan)
- **Tiptap'in built-in `history` (undo/redo) extension'ı zaten var.** Üç review da kaçırılmış olduğunu vurguladı. Build vs. zaten-var sorgusu hiç yapılmadı.
- **Asıl risk yüzeyi yalnızca "sayfa/tab kapanması + crash"** — bu `beforeunload` + localStorage snapshot ile tek başına çözülür. PostRevision tablosu bu spesifik problemi gereğinden fazla ele alıyor.
- **Dev ortamı tehlikesi:** Next.js HMR + Prisma SQLite + 5sn autosave kombinasyonu prod'da değil **dev'de** problem üretir (Reviewer 2).
- **Backlog hijyeni:** "GSU-5'i ertele" demek issue'yu çürütür. Doğru hareket: issue'yu **localStorage-tabanlı yeni bir spec ile yeniden yaz** ya da kapat (Reviewer 2).
- **GSU-5'in diğer issue'larla bağımlılık haritası** hiç sorgulanmadı (Reviewer 1).

### The Recommendation
**GSU-5'i spec'teki haliyle yapma. Issue'yu yeniden yaz, scope'u %80 küçült, hemen ship et.**

Yeni scope ("GSU-5 v0", ~3-4 saat):
1. **İstemci tarafı koruma (asli savunma):** Tiptap `onUpdate` → `localStorage` (debounce 1sn). Sayfa açılışta `Post.contentJson`'dan farklıysa "kurtarılmamış taslağın var, yükleyeyim mi?" prompt'u. `beforeunload` ile son state'i yaz.
2. **Tiptap `history` extension'ını opsiyon olarak çağır** (zaten StarterKit'te var, doğrula) — oturum içi undo/redo derinliğini 100'e çıkar.
3. **"Saved Xs ago" indikatörü** — localStorage timestamp'inden, sunucuya gitmiyor.
4. **Sunucu tarafı revision'ı bu sprint'te YAZMA.** PostRevision tablosunu Postgres geçişinden (GSU-2) sonra, yalnızca **manuel "Save snapshot" butonuyla** ekle. Auto-snapshot yok.

Neden bu öneri majoriteyle uyumlu (3/5 advisor + 3/3 reviewer)?
- Kayıp-yazı korkusunun %95'ini çözer (First Principles + Outsider).
- SQLite write-lock riskini sıfırlar (Contrarian).
- Executor'ın 2.5 saatlik kod planı 1.5 saate iner — kalan 1 saat farklı issue'ya gider.
- Expansionist'in vizyonunu kapatmaz: PostRevision tablosu **gerektiğinde** Postgres üstünde, daha zengin alanlarla (userId, wordCount) eklenir.
- Tiptap'in zaten yaptığını yeniden yazmaz.

Çoğunluk "ertele" diyordu; Chairman olarak **"yeniden tanımla, küçülterek hemen ship et"** diyorum — ertelemek backlog hijyeninden geçmez (Reviewer 2 katkısı).

### The One Thing to Do First
**Linear'a dön, GSU-5'in description'ını yeniden yaz ve title'ı değiştir:** "Client-side draft recovery + session history (Tiptap + localStorage)". Sunucu tarafı PostRevision spec'ini bu issue'dan çıkar, ayrı yeni bir issue olarak GSU-2 (Postgres) sonrasına bağla. Spec'i yazınca, ilk commit `hooks/useDraftRecovery.ts` olur.

---

*Methodology: Karpathy LLM Council. Skill: tenfoldmarc/llm-council-skill.*
