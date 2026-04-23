
(function(){
  const params = new URLSearchParams(location.search);
  const tankNo = params.get('tankNo') || '';
  const tankLabel = params.get('tankLabel') || (tankNo ? `No.${tankNo}` : '未指定');
  const fullL = params.get('fullL') || '';
  const bottomL = params.get('bottomL') || '';
  const centerMm = params.get('centerMm') || '';
  const perMm = params.get('perMm') || '';
  const calcMode = params.get('calcMode') || 'fixed';
  const boundaryMode = params.get('boundaryMode') || 'none';
  const returnScreen = params.get('returnScreen') || 'tank2mm-screen';
  const segmentsParam = params.get('segments') || '';
  const segmentAlertsParam = params.get('segmentAlerts') || '';
  const auditStatusNote = params.get('auditStatusNote') || '';
  const auditHero = document.getElementById('audit-hero');
  const auditHeroBadge = document.getElementById('audit-hero-badge');
  const auditHeroTitle = document.getElementById('audit-hero-title');
  const auditHeroNote = document.getElementById('audit-hero-note');
  const activeGaugeParam = params.get('tm2activegauge') || (params.get('tm2mode') === 'gauge' ? (params.get('tm2gauge') || '') : '');
  const returnUrl = params.get('returnUrl') || '';
  const TM2_RETURN_KEY = 'sake-tools-tm2-return-v1';
  const activeGauge = Number(activeGaugeParam);
  const calcModeLabels = {
    fixed:'固定の1mm当で計算',
    segment_linear:'区間の始点Lと終点Lから1mm当を再計算',
    segment_recorded:'区間の記載1mm当をそのまま使う計算'
  };
  const boundaryLabels = {
    none:'固定1mm当のため切替なし',
    inclusive:'区間の端もその区間の値で計算',
    next:'1mm当は区間の終わりで次の値に切り替え'
  };
  const calcSteps = {
    fixed:[
      '中心深 − 検尺（空積深） = 入身深 を出します。',
      '底板面以下 ＋ 入身深 × 1mm当 で容量を出し、最後に1L未満を切り捨てます。'
    ],
    segment_linear:[
      '中心深 − 検尺（空積深） = 入身深 を出します。',
      'その入身深が入る区間を選び、区間の始点Lと終点Lから1mm当を再計算して容量を出し、最後に1L未満を切り捨てます。'
    ],
    segment_recorded:[
      '中心深 − 検尺（空積深） = 入身深 を出します。',
      'その入身深が入る区間を選び、開始容量 ＋ 区間に入ってからのmm × 1mm当 で容量を出して最後に1L未満を切り捨てます。'
    ]
  };
  const segments = segmentsParam ? segmentsParam.split('|').map(row => {
    const [startDepth,endDepth,startL,endL,recordedPerMm] = row.split(',');
    return {
      startDepth:Number(startDepth),
      endDepth:Number(endDepth),
      startL:Number(startL),
      endL:Number(endL),
      recordedPerMm:Number(recordedPerMm)
    };
  }).filter(item => Number.isFinite(item.startDepth) && Number.isFinite(item.endDepth) && Number.isFinite(item.startL) && Number.isFinite(item.endL) && Number.isFinite(item.recordedPerMm)) : [];
  const segmentAlerts = (() => {
    if(!segmentAlertsParam) return [];
    try{
      const parsed = JSON.parse(decodeURIComponent(segmentAlertsParam));
      return Array.isArray(parsed) ? parsed : [];
    }catch{
      return [];
    }
  })();
  function normalizeAuditStatusNote(note){
    const normalized = String(note || '')
      .replace('詳細は登録値を見るで確認してください。', '黄色の行で確認してください。')
      .replace(/内部整合差/g, '計算上の差')
      .trim();
    const isTank128 = String(tankNo) === '128';
    const firstSegment = Array.isArray(segments) ? segments.find(item => Number(item.startDepth) === 0 && Number(item.endDepth) === 552 && Number(item.startL) === 662 && Number(item.endL) === 2982 && Number(item.recordedPerMm) === 4.393) : null;
    if(isTank128 && firstSegment && normalized.includes('原票記載1mm当 4.393L と区間差分再計算 4.202899L に大きな差がある')){
      const recorded = Number(firstSegment.recordedPerMm);
      const recalculated = Number(((Number(firstSegment.endL) - Number(firstSegment.startL)) / (Number(firstSegment.endDepth) - Number(firstSegment.startDepth))).toFixed(6));
      const diff = Number((recorded - recalculated).toFixed(6));
      return `第1帯先頭 0〜552mm は、原票記載1mm当 ${recorded.toFixed(3)}L と区間差分再計算 ${recalculated.toFixed(6)}L に約 ${diff.toFixed(6)}L の差があります。現在アプリは区間差分再計算を採用し、この帯は要注意として表示します。黄色の行で確認してください。`;
    }
    return normalized;
  }
  function getSegmentForLiquidDepth(liquidDepth){
    if(!Number.isFinite(liquidDepth)) return null;
    if(boundaryMode === 'next'){
      for(let i=0;i<segments.length;i++){
        const item = segments[i];
        const isLast = i === segments.length - 1;
        if(isLast){
          if(liquidDepth >= item.startDepth && liquidDepth <= item.endDepth) return item;
        }else if(liquidDepth >= item.startDepth && liquidDepth < item.endDepth){
          return item;
        }
      }
      return null;
    }
    return segments.find(item => liquidDepth >= item.startDepth && liquidDepth <= item.endDepth) || null;
  }
  function buildCurrentExample(){
    if(!Number.isFinite(activeGauge) || !Number.isFinite(Number(centerMm)) || activeGauge < 0 || activeGauge > Number(centerMm)) return '';
    const liquidDepth = Number(centerMm) - activeGauge;
    if(calcMode === 'fixed'){
      if(!Number.isFinite(Number(bottomL)) || !Number.isFinite(Number(fullL)) || !Number.isFinite(Number(centerMm)) || Number(centerMm) === 0) return `中心深 ${centerMm}mm − 検尺（空積深） ${activeGauge}mm = 入身深 ${liquidDepth}mm。底板面以下 ${bottomL}L ＋ ${liquidDepth}mm × 1mm当 で容量を出します。`;
      const formulaPerMm = Number.isFinite(Number(perMm)) ? Number(perMm) : ((Number(fullL) - Number(bottomL)) / Number(centerMm));
      const raw = Number(bottomL) + (liquidDepth * formulaPerMm);
      return `中心深 ${centerMm}mm − 検尺（空積深） ${activeGauge}mm = 入身深 ${liquidDepth}mm。底板面以下 ${bottomL}L ＋ ${liquidDepth}mm × 1mm当 ${formulaPerMm.toFixed(4)}L = ${raw.toFixed(5)}L、表示は ${Math.floor(raw)}Lです。`;
    }
    const segment = getSegmentForLiquidDepth(liquidDepth);
    if(!segment) return `中心深 ${centerMm}mm − 検尺（空積深） ${activeGauge}mm = 入身深 ${liquidDepth}mm。入身深が入る区間で容量を出します。`;
    const diffMm = liquidDepth - segment.startDepth;
    const segmentPerMm = calcMode === 'segment_recorded'
      ? Number(segment.recordedPerMm)
      : ((Number(segment.endL) - Number(segment.startL)) / (Number(segment.endDepth) - Number(segment.startDepth)));
    const raw = Number(segment.startL) + (diffMm * segmentPerMm);
    return `中心深 ${centerMm}mm − 検尺（空積深） ${activeGauge}mm = 入身深 ${liquidDepth}mm。入身深 ${liquidDepth}mm は ${segment.startDepth}〜${segment.endDepth}mm の区間なので、開始容量 ${segment.startL}L（${segment.startDepth}mm）＋ ${diffMm}mm × 1mm当 ${segmentPerMm.toFixed(6)}L = ${raw.toFixed(5)}L、表示は ${Math.floor(raw)}Lです。`;
  }
  document.getElementById('page-title').textContent = tankNo ? `${tankLabel} / タンク登録詳細` : 'タンク登録詳細';
  document.getElementById('tank-label').textContent = tankLabel;
  document.getElementById('calc-label').textContent = calcModeLabels[calcMode] || calcModeLabels.fixed;
  document.getElementById('full-l').textContent = fullL ? `${fullL}L` : '—';
  document.getElementById('bottom-l').textContent = bottomL ? `${bottomL}L` : '—';
  document.getElementById('center-mm').textContent = centerMm ? `${centerMm}mm` : '—';
  document.getElementById('boundary-label').textContent = boundaryLabels[boundaryMode] || boundaryLabels.none;
  const fixedPerMmCard = document.getElementById('fixed-permm-card');
  const fixedPerMmValue = document.getElementById('fixed-permm');
  if(calcMode === 'fixed' && fixedPerMmCard && fixedPerMmValue && perMm){
    fixedPerMmCard.hidden = false;
    fixedPerMmValue.textContent = `${Number(perMm).toFixed(String(perMm).includes('.') ? String(perMm).split('.')[1].length : 0)}L`;
  }
  document.getElementById('calc-steps').innerHTML = (calcSteps[calcMode] || calcSteps.fixed).map(text => `<div class="row"><div class="row-text">${text}</div></div>`).join('');
  const calcExample = buildCurrentExample();
  document.getElementById('calc-example').innerHTML = calcExample ? `<div class="row"><div class="row-title">今の入力での計算</div><div class="row-text">${calcExample}</div></div>` : '';

  function buildNo111InvestigationMemo(){
    const card = document.getElementById('investigation-card');
    const body = document.getElementById('investigation-body');
    if(!card || !body) return;
    if(String(tankNo) !== '111'){
      card.hidden = true;
      body.innerHTML = '';
      return;
    }
    card.hidden = false;
    body.innerHTML = `
      <details class="memo-details" open>
        <summary>先に結論</summary>
        <div class="memo-body">
          <div class="memo-box">
            <div class="memo-box-title">いま一番筋が通る整理</div>
            <div class="memo-box-text">紙2mm表は「区間の本当の比率を使って最後に切り捨て」、酒仙は「区間の本当の比率を使って最後に四捨五入」、現在アプリは「区間の始点L / 終点L から1mm当を再計算して最後に切り捨て」に切り替えています。旧方式との差を見る時は、この前提で読み替えてください。</div>
          </div>
          <div class="diagram-box"><code>差の原因は2段あります

段1: 1mm当たり容量を何で出すか
  A. 実比率 300÷182 = 1.648351648...
  B. 記載値 1.648

段2: 最後にどう整数化するか
  a. 切り捨て
  b. 四捨五入

紙2mm表 = A + a
酒仙     = A + b
現在アプリ = B + a</code></div>
        </div>
      </details>

      <details class="memo-details">
        <summary>対象区間と図</summary>
        <div class="memo-body">
          <div class="memo-box">
            <div class="memo-box-title">今回の主要対象</div>
            <div class="memo-box-text">No.111 の最上段区間です。開始深さ 1112mm、終了深さ 1294mm、開始容量 1958L、終了容量 2258L なので、区間差は 182mm / 300L です。</div>
          </div>
          <div class="diagram-box"><code>満量側（尺0）
  ↓
深さ 1294mm / 容量 2258L
  │
  │  この182mmが最上段区間
  │
深さ 1112mm / 容量 1958L</code></div>
          <div class="formula-box"><code>区間の本当の1mm当たり容量
= (2258 - 1958) ÷ (1294 - 1112)
= 300 ÷ 182
= 1.648351648... L/mm

容器検定簿の記載値
= 1.648 L/mm</code></div>
          <div class="memo-box">
            <div class="memo-box-title">ここで重要な点</div>
            <div class="memo-box-text">1mmごとの差は小さいですが、182mmぶん積むと約0.064Lずれます。これが最後の整数化で 1L差として出やすくなります。</div>
          </div>
        </div>
      </details>

      <details class="memo-details">
        <summary>3者の計算式</summary>
        <div class="memo-body">
          <div class="memo-box">
            <div class="memo-box-title">紙2mm表（有力仮説）</div>
            <div class="formula-box"><code>紙 = floor( 1958 + (182 - s) × (300/182) )</code></div>
            <div class="memo-box-text">s は尺(mm)です。区間の本当の比率を使って、最後に切り捨てる考え方です。</div>
          </div>
          <div class="memo-box">
            <div class="memo-box-title">酒仙（有力仮説）</div>
            <div class="formula-box"><code>酒仙 = round( 1958 + (182 - s) × (300/182) )</code></div>
            <div class="memo-box-text">使う比率は紙と同じで、最後だけ四捨五入すると考えると、確認済み値と合いやすいです。</div>
          </div>
          <div class="memo-box">
            <div class="memo-box-title">現在アプリ（コード確認済み）</div>
            <div class="formula-box"><code>アプリ = floor( 1958 + (182 - s) × 1.648 )</code></div>
            <div class="memo-box-text">旧方式では、区間の本当の比率 300÷182 をその場で再計算せず、保存済みの記載1mm当 1.648 をそのまま使っていました。現在アプリは、区間の始点L / 終点L から1mm当を再計算する方式に切り替えています。</div>
          </div>
        </div>
      </details>

      <details class="memo-details">
        <summary>尺0 / 尺2 / 尺20 の具体例</summary>
        <div class="memo-body">
          <div class="memo-box">
            <div class="memo-box-title">尺0</div>
            <div class="formula-box"><code>紙 / 酒仙の生値
= 1958 + 182 × (300/182)
= 2258.000...

アプリの生値
= 1958 + 182 × 1.648
= 2257.936</code></div>
            <div class="memo-box-text">結果: 紙2258 / 酒仙2258 / アプリ2257</div>
          </div>
          <div class="memo-box">
            <div class="memo-box-title">尺2</div>
            <div class="formula-box"><code>紙 / 酒仙の生値
= 1958 + 180 × (300/182)
= 2254.703...

アプリの生値
= 1958 + 180 × 1.648
= 2254.640</code></div>
            <div class="memo-box-text">結果: 紙2254 / 酒仙2255 / アプリ2254</div>
          </div>
          <div class="memo-box">
            <div class="memo-box-title">尺20</div>
            <div class="formula-box"><code>紙 / 酒仙の生値
= 1958 + 162 × (300/182)
= 2225.032...

アプリの生値
= 1958 + 162 × 1.648
= 2224.976</code></div>
            <div class="memo-box-text">結果: 紙2225 / 酒仙2225 / アプリ2224</div>
          </div>
        </div>
      </details>

      <details class="memo-details">
        <summary>内部ロジックをどう直すか</summary>
        <div class="memo-body">
          <div class="memo-box">
            <div class="memo-box-title">いま決めなくてよいこと</div>
            <div class="memo-box-text">紙寄りなら最後は切り捨て、酒仙寄りなら最後は四捨五入ですが、ここは今すぐ決めなくても構いません。先に「1mm当の出し方」だけを整える考え方は筋が良いです。</div>
          </div>
          <div class="formula-box"><code>先に揃える候補
再計算1mm当 = (区間終点容量 - 区間始点容量) ÷ (区間終点深さ - 区間始点深さ)

No.111 の最上段なら
= (2258 - 1958) ÷ (1294 - 1112)
= 300 ÷ 182
= 1.648351648...</code></div>
          <div class="memo-box">
            <div class="memo-box-title">この順番が安全な理由</div>
            <div class="memo-box-text">現在アプリ特有の「記載丸め値 1.648 をそのまま使うことによるズレ」を先に減らせます。丸め方はそのあとで、紙寄り / 酒仙寄り / 独自運用 のどれにするか判断できます。</div>
          </div>
          <div class="memo-box">
            <div class="memo-box-title">ただし要注意</div>
            <div class="memo-box-text">No.111 だけではなく、No.59 / 126 / 127 / 128 / 129 / 141 / 142 なども区間境界を持つタンクです。現在アプリの共通コアは、区間の始点L / 終点L から1mm当を再計算する方式へ切り替えています。</div>
          </div>
        </div>
      </details>

      <details class="memo-details">
        <summary>現時点の判断</summary>
        <div class="memo-body">
          <div class="memo-chip-row">
            <span class="memo-chip">確認済み: 現在アプリは区間差分再計算 + 切り捨て</span>
            <span class="memo-chip">有力推測: 紙は実比率 + 切り捨て</span>
            <span class="memo-chip">有力推測: 酒仙は実比率 + 四捨五入</span>
            <span class="memo-chip memo-warn">要確認: 他尺・他タンクでの再照合</span>
          </div>
          <div class="memo-box">
            <div class="memo-box-title">次に触るなら</div>
            <div class="memo-box-text">まず No.111 で「内部の1mm当を各区間ごとに再計算する」方向だけを試験対象にし、最後の丸め方は保留のままにするのが安全です。</div>
          </div>
        </div>
      </details>
    `;
  }
  buildNo111InvestigationMemo();
  const normalizedAuditStatusNote = normalizeAuditStatusNote(auditStatusNote);
  const hasCaution = Boolean(normalizedAuditStatusNote || segmentAlerts.length);
  if(auditHero){
    auditHero.hidden = false;
    auditHero.className = `hero-status ${hasCaution ? 'is-caution' : 'is-ok'}`;
    if(auditHeroBadge) auditHeroBadge.textContent = hasCaution ? '注意あり' : '登録済み';
    if(auditHeroTitle) auditHeroTitle.textContent = hasCaution ? '確認時に注意が必要な区間があります。' : 'このタンクは登録値確認用の表示です。';
    if(auditHeroNote){
      auditHeroNote.hidden = !normalizedAuditStatusNote;
      auditHeroNote.textContent = normalizedAuditStatusNote || '';
    }
  }
  const segmentCard = document.getElementById('segment-card');
  const segmentList = document.getElementById('segment-list');
  const segmentNote = document.getElementById('segment-note');
  if(segmentCard && segmentList && segments.length){
    segmentCard.hidden = false;
    const hasSegmentCaution = segmentAlerts.length > 0;
    if(segmentNote) segmentNote.hidden = !hasSegmentCaution;
    segmentList.innerHTML = segments.map((item, index) => {
      const alert = segmentAlerts.find(entry => {
        if(Number.isFinite(entry.index)) return Number(entry.index) === index;
        return Number(entry.start_depth_mm) === Number(item.startDepth) && Number(entry.end_depth_mm) === Number(item.endDepth);
      }) || null;
      const rowClass = alert ? 'segment-row is-caution' : 'segment-row';
      const alertMarkup = alert && alert.note ? `<div class="segment-alert">${alert.note}</div>` : '';
      return `
      <div class="${rowClass}">
        <div class="segment-cell"><div class="segment-head"><span class="segment-band">第${index + 1}帯</span>入身深の範囲</div><div class="segment-value">${item.startDepth}〜${item.endDepth}mm</div></div>
        <div class="segment-cell"><div class="segment-head">開始容量</div><div class="segment-value">${item.startL}L</div></div>
        <div class="segment-cell"><div class="segment-head">終わり容量</div><div class="segment-value">${item.endL}L</div></div>
        <div class="segment-cell"><div class="segment-head">1mm当</div><div class="segment-value">${item.recordedPerMm.toFixed(3)}L</div></div>
        ${alertMarkup}
      </div>`;
    }).join('');
  }
  document.getElementById('backToTm2').addEventListener('click', function(){
    const payload = {
      screen: 'tank2mm-screen',
      groupKey: params.get('tm2group') || '',
      tankNo: params.get('tm2tank') || '',
      mode: params.get('tm2mode') === 'volume' ? 'volume' : 'gauge',
      inputValue: params.get('tm2input') || '',
      gaugeValue: params.get('tm2gauge') || '',
      volumeValue: params.get('tm2volume') || '',
      listOpen: (params.get('tm2list') || '') === '1',
      activeGauge: params.get('tm2activegauge') || '',
      scrollTargetGauge: params.get('tm2scrollgauge') || params.get('tm2activegauge') || ''
    };
    const backParams = new URLSearchParams();
    backParams.set('screen', returnScreen || 'tank2mm-screen');
    backParams.set('tm2return', '1');
    if(payload.groupKey) backParams.set('tm2group', payload.groupKey);
    if(payload.tankNo) backParams.set('tm2tank', payload.tankNo);
    if(payload.mode) backParams.set('tm2mode', payload.mode);
    if(payload.gaugeValue) backParams.set('tm2gauge', payload.gaugeValue);
    if(payload.volumeValue) backParams.set('tm2volume', payload.volumeValue);
    if(payload.listOpen) backParams.set('tm2list', '1');
    if(payload.activeGauge) backParams.set('tm2activegauge', payload.activeGauge);
    if(payload.scrollTargetGauge) backParams.set('tm2scrollgauge', payload.scrollTargetGauge);
    if(payload.inputValue) backParams.set('tm2input', payload.inputValue);
    const targetUrl = returnUrl || `./index.html?${backParams.toString()}`;
    try{ localStorage.setItem(TM2_RETURN_KEY, JSON.stringify(payload)); }catch{}
    try{ localStorage.setItem('sake-tools-last-screen-v2','tank2mm-screen'); }catch{}
    try{
      const raw = localStorage.getItem('sake-tools-ui-state-v1');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.screen = 'tank2mm-screen';
      parsed.tm2State = payload;
      localStorage.setItem('sake-tools-ui-state-v1', JSON.stringify(parsed));
    }catch{}
    try{ sessionStorage.setItem('sake-tools-force-screen-v1','tank2mm-screen'); }catch{}
    window.location.href = targetUrl;
  });
})();
