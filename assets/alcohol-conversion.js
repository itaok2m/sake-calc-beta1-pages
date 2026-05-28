(function(){
  'use strict';

  const STORAGE_KEYS = {
    hydrometers: 'sake_alcohol_conversion_hydrometer_master_v1',
    lastHydrometer: 'sake_alcohol_conversion_last_hydrometer_v1',
    lastInputs: 'sake_alcohol_conversion_last_inputs_v1'
  };

  const DEFAULT_HYDROMETERS = [
    {id:'h_0_5', label:'0〜5', min:0, max:5, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:0,kisa:-0.10},{degree:2,kisa:-0.05},{degree:5,kisa:-0.05}]},
    {id:'h_5_10', label:'5〜10', min:5, max:10, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:5,kisa:-0.10},{degree:8,kisa:-0.20},{degree:10,kisa:-0.20}]},
    {id:'h_8_13', label:'8〜13', min:8, max:13, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:8,kisa:+0.05},{degree:10,kisa:+0.20},{degree:13,kisa:+0.05}]},
    {id:'h_10_15', label:'10〜15', min:10, max:15, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:10,kisa:+0.05},{degree:12,kisa:0.00},{degree:15,kisa:0.00}]},
    {id:'h_13_18', label:'13〜18', min:13, max:18, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:13,kisa:-0.10},{degree:15,kisa:-0.05},{degree:18,kisa:-0.15}]},
    {id:'h_15_20', label:'15〜20', min:15, max:20, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:15,kisa:+0.15},{degree:18,kisa:+0.15},{degree:20,kisa:+0.10}]},
    {id:'h_18_23', label:'18〜23', min:18, max:23, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:18,kisa:-0.05},{degree:20,kisa:-0.05},{degree:23,kisa:0.00}]},
    {id:'h_25_30', label:'25〜30', min:25, max:30, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:25,kisa:+0.05},{degree:28,kisa:+0.10},{degree:30,kisa:+0.05}]},
    {id:'h_30_35', label:'30〜35', min:30, max:35, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:30,kisa:+0.15},{degree:32,kisa:0.00},{degree:35,kisa:+0.05}]},
    {id:'h_90_100', label:'90〜100', min:90, max:100, inspectionDate:'', nextInspectionGuide:'', status:'using', points:[{degree:90,kisa:0.00},{degree:95,kisa:-0.05},{degree:100,kisa:+0.20}]}
  ];

  const el = {
    reading: document.getElementById('alcohol-conversion-reading'),
    temp: document.getElementById('alcohol-conversion-temp'),
    hydrometer: document.getElementById('alcohol-conversion-hydrometer'),
    candidates: document.getElementById('alcohol-conversion-kisa-candidates'),
    kisa: document.getElementById('alcohol-conversion-kisa'),
    correctedCard: document.getElementById('alcohol-conversion-corrected-card'),
    result: document.getElementById('alcohol-conversion-result'),
    corrected: document.getElementById('alcohol-conversion-corrected'),
    final: document.getElementById('alcohol-conversion-final'),
    error: document.getElementById('alcohol-conversion-error'),
    reset: document.getElementById('alcohol-conversion-reset'),
    tableLink: document.getElementById('alcohol-conversion-open-table')
  };

  let hydrometers = loadHydrometers();
  let manualKisaTouched = false;
  let activeCandidateKey = '';

  // 2026-05-28: 15℃補正後アルコール分の自動結果カードは表示しない。
  // 補正後示度と測定温度から横田表画像へ進む。
  const TEMP_TABLE = null;

  function buildTemperatureTable(){
    const grid = new Map();
    function key(degree, temp){ return degree.toFixed(0) + ':' + temp.toFixed(0); }
    function setValue(degree, temp, value){
      if (Number.isFinite(value)) grid.set(key(degree, temp), value);
    }
    for (let t=0; t<=35; t += 1) setValue(0, t, 0);
    function addBlock(start, rowLines){
      rowLines.trim().split('\n').forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (!parts.length) return;
        const temp = Number(parts[0]);
        for (let i=1; i<parts.length; i += 1) {
          const token = parts[i];
          if (token === 'x' || token === '-') continue;
          setValue(start + i - 1, temp, Number(token));
        }
      });
    }
    addBlock(1, `
0 1.2 2.3 3.3 4.3 5.4 6.5 7.6 8.7 9.8 11.0
1 1.3 2.3 3.3 4.4 5.4 6.5 7.6 8.7 9.8 11.0
2 1.3 2.4 3.4 4.4 5.5 6.6 7.6 8.7 9.9 11.0
3 1.4 2.4 3.4 4.5 5.5 6.6 7.6 8.7 9.9 11.0
4 1.4 2.4 3.5 4.5 5.5 6.6 7.7 8.7 9.9 11.0
5 1.4 2.4 3.5 4.5 5.5 6.6 7.7 8.7 9.8 10.9
6 1.4 2.4 3.5 4.5 5.5 6.6 7.6 8.7 9.8 10.9
7 1.4 2.4 3.4 4.5 5.5 6.6 7.6 8.7 9.8 10.8
8 1.4 2.4 3.4 4.4 5.5 6.5 7.6 8.6 9.7 10.8
9 1.3 2.4 3.4 4.4 5.4 6.5 7.5 8.6 9.6 10.7
10 1.3 2.3 3.3 4.4 5.4 6.4 7.5 8.5 9.5 10.6
11 1.3 2.3 3.3 4.3 5.3 6.3 7.4 8.4 9.5 10.5
12 1.2 2.2 3.2 4.2 5.3 6.3 7.3 8.3 9.4 10.4
13 1.1 2.2 3.2 4.2 5.2 6.2 7.2 8.2 9.2 10.3
14 1.1 2.1 3.1 4.1 5.1 6.1 7.1 8.1 9.1 10.1
15 1.0 2.0 3.0 4.0 5.0 6.0 7.0 8.0 9.0 10.0
16 0.9 1.9 2.9 3.9 4.9 5.9 6.9 7.9 8.9 9.9
17 0.8 1.8 2.8 3.8 4.8 5.8 6.8 7.7 8.7 9.7
18 0.7 1.7 2.7 3.7 4.7 5.6 6.6 7.6 8.6 9.6
19 0.6 1.6 2.6 3.6 4.5 5.5 6.5 7.5 8.4 9.4
20 0.5 1.5 2.5 3.4 4.4 5.4 6.3 7.3 8.3 9.2
21 0.4 1.3 2.3 3.3 4.3 5.2 6.2 7.1 8.1 9.0
22 0.2 1.2 2.2 3.2 4.1 5.1 6.0 7.0 7.9 8.9
23 0.1 1.1 2.0 3.0 4.0 4.9 5.9 6.8 7.7 8.7
24 x 0.9 1.9 2.9 3.8 4.8 5.7 6.6 7.6 8.5
25 x 0.8 1.7 2.7 3.6 4.6 5.5 6.4 7.4 8.3
26 x 0.6 1.6 2.5 3.5 4.4 5.3 6.3 7.2 8.1
27 x 0.5 1.4 2.4 3.3 4.2 5.2 6.1 7.0 7.9
28 x 0.3 1.2 2.2 3.1 4.0 5.0 5.9 6.8 7.7
29 x 0.1 1.1 2.0 2.9 3.8 4.8 5.7 6.6 7.4
30 x x 0.9 1.8 2.7 3.7 4.6 5.5 6.3 7.2
31 x x 0.7 1.6 2.5 3.4 4.3 5.2 6.1 7.0
32 x x 0.5 1.4 2.3 3.2 4.1 5.0 5.9 6.8
33 x x 0.3 1.2 2.1 3.0 3.9 4.8 5.7 6.5
34 x x 0.1 1.0 1.9 2.8 3.7 4.6 5.4 6.3
35 x x x 0.8 1.7 2.6 3.5 4.3 5.2 6.0
`);
    addBlock(11, `
0 12.2 13.4 14.7 16.0 17.4 18.8 20.2 21.7 23.1 24.5
1 12.2 13.4 14.7 16.0 17.3 18.6 20.0 21.4 22.8 24.2
2 12.2 13.4 14.6 15.9 17.2 18.5 19.8 21.2 22.5 23.9
3 12.2 13.3 14.6 15.8 17.1 18.3 19.6 21.0 22.3 23.5
4 12.1 13.3 14.5 15.7 16.9 18.2 19.4 20.7 22.0 23.2
5 12.1 13.2 14.4 15.6 16.8 18.0 19.2 20.5 21.7 22.9
6 12.0 13.1 14.3 15.5 16.6 17.8 19.0 20.2 21.5 22.6
7 11.9 13.0 14.2 15.3 16.5 17.6 18.8 20.0 21.2 22.3
8 11.9 12.9 14.1 15.2 16.3 17.5 18.6 19.7 20.9 22.0
9 11.8 12.8 13.9 15.0 16.1 17.3 18.4 19.5 20.6 21.7
10 11.7 12.7 13.8 14.9 16.0 17.1 18.2 19.3 20.4 21.5
11 11.5 12.6 13.7 14.7 15.8 16.9 17.9 19.0 20.1 21.2
12 11.4 12.5 13.5 14.5 15.6 16.6 17.7 18.8 19.8 20.9
13 11.3 12.3 13.3 14.4 15.4 16.4 17.5 18.5 19.5 20.6
14 11.2 12.2 13.2 14.2 15.2 16.2 17.2 18.3 19.3 20.3
15 11.0 12.0 13.0 14.0 15.0 16.0 17.0 18.0 19.0 20.0
16 10.8 11.8 12.8 13.8 14.8 15.8 16.8 17.7 18.7 19.7
17 10.7 11.7 12.6 13.6 14.6 15.5 16.5 17.5 18.4 19.4
18 10.5 11.5 12.4 13.4 14.4 15.3 16.3 17.2 18.2 19.1
19 10.3 11.3 12.3 13.2 14.1 15.1 16.0 17.0 17.9 18.8
20 10.2 11.1 12.1 13.0 13.9 14.8 15.8 16.7 17.6 18.5
21 10.0 10.9 11.8 12.8 13.7 14.6 15.5 16.4 17.3 18.2
22 9.8 10.7 11.6 12.5 13.4 14.4 15.3 16.2 17.1 18.0
23 9.6 10.5 11.4 12.3 13.2 14.1 15.0 15.9 16.8 17.7
24 9.4 10.3 11.2 12.1 13.0 13.9 14.7 15.6 16.5 17.4
25 9.2 10.1 11.0 11.9 12.7 13.6 14.5 15.3 16.2 17.1
26 9.0 9.9 10.7 11.6 12.5 13.4 14.2 15.1 15.9 16.8
27 8.8 9.6 10.5 11.4 12.2 13.1 13.9 14.8 15.6 16.5
28 8.5 9.4 10.3 11.1 12.0 12.8 13.7 14.5 15.3 16.2
29 8.3 9.2 10.0 10.9 11.7 12.6 13.4 14.2 15.1 15.9
30 8.1 8.9 9.8 10.6 11.5 12.3 13.1 13.9 14.8 15.6
31 7.9 8.7 9.6 10.4 11.2 12.0 12.8 13.7 14.5 15.3
32 7.6 8.5 9.3 10.1 10.9 11.8 12.6 13.4 14.2 15.0
33 7.4 8.2 9.1 9.9 10.7 11.5 12.3 13.1 13.9 14.7
34 7.1 8.0 8.8 9.6 10.4 11.2 12.0 12.8 13.6 14.4
35 6.9 7.7 8.5 9.3 10.1 10.9 11.7 12.5 13.3 14.1
`);
    addBlock(21, `
0 25.9 27.2 28.5 29.8 31.0 32.1 33.2 34.3 35.3 36.4
1 25.5 26.8 28.1 29.3 30.5 31.7 32.8 33.8 34.9 35.9
2 25.2 26.5 27.7 28.9 30.1 31.2 32.3 33.4 34.5 35.5
3 24.8 26.1 27.3 28.5 29.7 30.8 31.9 33.0 34.0 35.0
4 24.5 25.7 26.9 28.1 29.2 30.3 31.5 32.5 33.6 34.6
5 24.2 25.4 26.5 27.7 28.8 29.9 31.0 32.1 33.1 34.2
6 23.8 25.0 26.2 27.3 28.4 29.5 30.6 31.7 32.7 33.7
7 23.5 24.7 25.8 26.9 28.0 29.1 30.2 31.2 32.3 33.3
8 23.2 24.3 25.4 26.5 27.6 28.7 29.8 30.8 31.9 32.9
9 22.9 24.0 25.1 26.2 27.2 28.3 29.4 30.4 31.4 32.5
10 22.5 23.6 24.7 25.8 26.9 27.9 29.0 30.0 31.0 32.1
11 22.2 23.3 24.4 25.4 26.5 27.5 28.6 29.6 30.6 31.6
12 21.9 23.0 24.0 25.1 26.1 27.1 28.2 29.2 30.2 31.2
13 21.6 22.6 23.7 24.7 25.7 26.7 27.8 28.8 29.8 30.8
14 21.3 22.3 23.3 24.3 25.4 26.4 27.4 28.4 29.4 30.4
15 21.0 22.0 23.0 24.0 25.0 26.0 27.0 28.0 29.0 30.0
16 20.7 21.7 22.7 23.6 24.6 25.6 26.6 27.6 28.6 29.6
17 20.4 21.4 22.3 23.3 24.3 25.3 26.2 27.2 28.2 29.2
18 20.1 21.0 22.0 23.0 23.9 24.9 25.9 26.8 27.8 28.8
19 19.8 20.7 21.7 22.6 23.6 24.5 25.5 26.5 27.4 28.4
20 19.5 20.4 21.3 22.3 23.2 24.2 25.1 26.1 27.0 28.0
21 19.2 20.1 21.0 21.9 22.9 23.8 24.7 25.7 26.7 27.6
22 18.9 19.8 20.7 21.6 22.5 23.4 24.4 25.3 26.3 27.2
23 18.6 19.5 20.4 21.3 22.2 23.1 24.0 24.9 25.9 26.8
24 18.3 19.1 20.0 20.9 21.8 22.7 23.6 24.6 25.5 26.5
25 17.9 18.8 19.7 20.6 21.5 22.4 23.3 24.2 25.1 26.1
26 17.6 18.5 19.4 20.3 21.1 22.0 22.9 23.8 24.8 25.7
27 17.3 18.2 19.0 19.9 20.8 21.7 22.6 23.5 24.4 25.3
28 17.0 17.9 18.7 19.6 20.4 21.3 22.2 23.1 24.0 24.9
29 16.7 17.6 18.4 19.2 20.1 21.0 21.8 22.7 23.6 24.5
30 16.4 17.2 18.1 18.9 19.8 20.6 21.5 22.4 23.3 24.2
31 16.1 16.9 17.7 18.6 19.4 20.3 21.1 22.0 22.9 23.8
32 15.8 16.6 17.4 18.2 19.1 19.9 20.8 21.6 22.5 23.4
33 15.5 16.3 17.1 17.9 18.7 19.6 20.4 21.3 22.2 23.0
34 15.2 16.0 16.8 17.6 18.4 19.2 20.1 20.9 21.8 22.7
35 14.9 15.6 16.4 17.2 18.1 18.9 19.7 20.6 21.4 22.3
`);
    addBlock(31, `
0 37.4 38.4 39.3 40.3 41.3
1 36.9 37.9 38.9 39.9 40.9
2 36.5 37.5 38.5 39.5 40.4
3 36.1 37.1 38.1 39.0 40.0
4 35.6 36.6 37.6 38.6 39.6
5 35.2 36.2 37.2 38.2 39.2
6 34.8 35.8 36.8 37.8 38.7
7 34.3 35.3 36.3 37.3 38.3
8 33.9 34.9 35.9 36.9 37.9
9 33.5 34.5 35.5 36.5 37.5
10 33.1 34.1 35.1 36.1 37.1
11 32.6 33.7 34.7 35.7 36.7
12 32.2 33.2 34.2 35.2 36.2
13 31.8 32.8 33.8 34.8 35.8
14 31.4 32.4 33.4 34.4 35.4
15 31.0 32.0 33.0 34.0 35.0
16 30.6 31.6 32.6 33.6 34.6
17 30.2 31.2 32.2 33.2 34.2
18 29.8 30.8 31.8 32.8 33.8
19 29.4 30.4 31.4 32.4 33.4
20 29.0 30.0 31.0 32.0 32.9
21 28.6 29.6 30.6 31.5 32.5
22 28.2 29.2 30.2 31.1 32.1
23 27.8 28.8 29.8 30.7 31.7
24 27.4 28.4 29.3 30.3 31.3
25 27.0 28.0 29.0 29.9 30.9
26 26.6 27.6 28.6 29.5 30.5
27 26.2 27.2 28.2 29.1 30.1
28 25.9 26.8 27.8 28.7 29.7
29 25.5 26.4 27.4 28.3 29.3
30 25.1 26.0 27.0 27.9 28.9
31 24.7 25.6 26.6 27.5 28.5
32 24.3 25.3 26.2 27.1 28.1
33 23.9 24.9 25.8 26.7 27.7
34 23.6 24.5 25.4 26.4 27.3
35 23.2 24.1 25.0 26.0 26.9
`);
    addBlock(90, `
0 93.6
1 93.4
2 93.1
3 92.9
4 92.7
5 92.4
6 92.2
7 92.0
8 91.7
9 91.5
10 91.2
11 91.0
12 90.8
13 90.5
14 90.3
15 90.0
16 89.7
17 89.5
18 89.2
19 89.0
20 88.7
21 88.4
22 88.2
23 87.9
24 87.6
25 87.4
26 87.1
27 86.8
28 86.5
29 86.2
30 86.0
31 85.7
32 85.4
33 85.1
34 84.8
35 84.5
`);
    addBlock(91, `
0 94.5 95.4 96.3 97.1 98.0 98.8 99.7 x x x
1 94.3 95.2 96.1 96.9 97.8 98.7 99.5 x x x
2 94.0 95.0 95.8 96.7 97.6 98.5 99.4 x x x
3 93.8 94.7 95.6 96.5 97.4 98.3 99.2 100.0 x x
4 93.6 94.5 95.4 96.3 97.2 98.1 99.0 99.9 x x
5 93.4 94.3 95.2 96.1 97.1 98.0 98.9 99.7 x x
6 93.1 94.1 95.0 95.9 96.9 97.8 98.7 99.6 x x
7 92.9 93.9 94.8 95.7 96.7 97.6 98.5 99.4 x x
8 92.7 93.6 94.6 95.5 96.5 97.4 98.3 99.2 x x
9 92.5 93.4 94.4 95.3 96.3 97.2 98.1 99.1 100.0 x
10 92.2 93.2 94.1 95.1 96.1 97.0 98.0 98.9 99.8 x
11 92.0 92.9 93.9 94.9 95.8 96.8 97.8 98.7 99.7 x
12 91.7 92.7 93.7 94.7 95.6 96.6 97.6 98.5 99.5 x
13 91.5 92.5 93.5 94.4 95.4 96.4 97.4 98.4 99.3 x
14 91.2 92.2 93.2 94.2 95.2 96.2 97.2 98.2 99.2 x
15 91.0 92.0 93.0 94.0 95.0 96.0 97.0 98.0 99.0 100.0
16 90.8 91.8 92.8 93.8 94.8 95.8 96.8 97.8 98.8 99.8
17 90.5 91.5 92.5 93.5 94.6 95.6 96.6 97.6 98.6 99.7
18 90.2 91.3 92.3 93.3 94.3 95.4 96.4 97.4 98.5 99.5
19 90.0 91.0 92.0 93.1 94.1 95.2 96.2 97.2 98.3 99.3
20 89.7 90.8 91.8 92.8 93.9 94.9 96.0 97.0 98.1 99.2
21 89.5 90.5 91.6 92.6 93.7 94.7 95.8 96.8 97.9 99.0
22 89.2 90.3 91.3 92.4 93.4 94.5 95.6 96.6 97.7 98.8
23 89.0 90.0 91.1 92.1 93.2 94.3 95.3 96.4 97.5 98.6
24 88.7 89.7 90.8 91.9 93.0 94.0 95.1 96.2 97.3 98.5
25 88.4 89.5 90.6 91.6 92.7 93.8 94.9 96.0 97.1 98.3
26 88.1 89.2 90.3 91.4 92.5 93.6 94.7 95.8 96.9 98.1
27 87.9 89.0 90.0 91.1 92.2 93.3 94.5 95.6 96.7 97.9
28 87.6 88.7 89.8 90.9 92.0 93.1 94.2 95.4 96.5 97.7
29 87.3 88.4 89.5 90.6 91.7 92.9 94.0 95.2 96.3 97.5
30 87.0 88.1 89.2 90.4 91.5 92.6 93.8 94.9 96.1 97.3
31 86.8 87.9 89.0 90.1 91.2 92.4 93.5 94.7 95.9 97.1
32 86.5 87.6 88.7 89.8 91.0 92.1 93.3 94.5 95.7 96.9
33 86.2 87.3 88.4 89.6 90.7 91.9 93.1 94.3 95.5 96.7
34 85.9 87.0 88.2 89.3 90.5 91.6 92.8 94.0 95.2 96.5
35 85.6 86.8 87.9 89.0 90.2 91.4 92.6 93.8 95.0 96.3
`);
    return {
      value(degree, temp){ return grid.get(key(degree, temp)); },
      has(degree, temp){ return grid.has(key(degree, temp)); }
    };
  }

  function safeGet(key){ try { return localStorage.getItem(key); } catch(_err){ return null; } }
  function safeSet(key, value){ try { localStorage.setItem(key, value); } catch(_err){} }
  function cloneDefaults(){ return JSON.parse(JSON.stringify(DEFAULT_HYDROMETERS)); }
  function loadHydrometers(){
    const raw = safeGet(STORAGE_KEYS.hydrometers);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch(_err) {}
    }
    const defaults = cloneDefaults();
    safeSet(STORAGE_KEYS.hydrometers, JSON.stringify(defaults));
    return defaults;
  }
  function numberValue(input){
    const raw = String(input && input.value || '').trim().replace(/,/g,'.');
    if (!raw) return NaN;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }
  function formatSigned(n, digits){
    if (!Number.isFinite(n)) return '—';
    const fixed = n.toFixed(digits);
    return n > 0 ? '+' + fixed : fixed;
  }
  function formatPlain(n, digits){ return Number.isFinite(n) ? n.toFixed(digits) : '—'; }
  function roundTo(n, digits){
    const m = Math.pow(10, digits);
    return Math.round((n + Number.EPSILON) * m) / m;
  }
  function selectedHydrometer(){
    return hydrometers.find(h => h.id === el.hydrometer.value) || hydrometers[0] || null;
  }
  function populateHydrometerOptions(){
    el.hydrometer.innerHTML = '';
    hydrometers.forEach((h) => {
      const opt = document.createElement('option');
      opt.value = h.id;
      opt.textContent = h.label;
      el.hydrometer.appendChild(opt);
    });
    const last = safeGet(STORAGE_KEYS.lastHydrometer);
    if (last && hydrometers.some(h => h.id === last)) el.hydrometer.value = last;
  }
  function getRegisteredKisaPoints(hydrometer){
    if (!hydrometer || !Array.isArray(hydrometer.points) || !hydrometer.points.length) return [];
    return hydrometer.points.map((p) => ({ degree:Number(p.degree), kisa:Number(p.kisa) }))
      .filter(p => Number.isFinite(p.degree) && Number.isFinite(p.kisa))
      .sort((a,b) => a.degree - b.degree);
  }
  function getKisaCandidates(reading, hydrometer){
    if (!Number.isFinite(reading)) return [];
    const points = getRegisteredKisaPoints(hydrometer);
    if (!points.length) return [];
    const withDistance = points.map((p) => ({ degree:p.degree, kisa:p.kisa, distance:Math.abs(reading - p.degree) }));
    const min = Math.min.apply(null, withDistance.map(p => p.distance));
    return withDistance.filter(p => Math.abs(p.distance - min) < 1e-9).sort((a,b) => a.degree - b.degree);
  }
  function candidateKey(c){ return c ? String(c.degree) + ':' + c.kisa.toFixed(2) : ''; }
  function renderCandidates(points, suggestedCandidates){
    el.candidates.innerHTML = '';
    if (!points.length) {
      const div = document.createElement('div');
      div.className = 'candidate-empty';
      div.textContent = '—';
      el.candidates.appendChild(div);
      activeCandidateKey = '';
      return;
    }
    const list = document.createElement('div');
    list.className = 'candidate-list';
    points.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kisa-candidate-btn';
      const key = candidateKey(c);
      btn.dataset.kisa = String(c.kisa);
      btn.dataset.key = key;
      btn.textContent = formatPlain(c.degree, Number.isInteger(c.degree) ? 0 : 1) + ' vol%時：' + formatSigned(c.kisa, 2) + ' vol%';
      btn.classList.toggle('is-active', key === activeCandidateKey);
      btn.addEventListener('click', () => {
        activeCandidateKey = key;
        manualKisaTouched = true;
        el.kisa.value = c.kisa.toFixed(2);
        updateAll();
      });
      list.appendChild(btn);
    });
    el.candidates.appendChild(list);
  }
  function pickDefaultCandidate(reading, candidates){
    if (!Number.isFinite(reading)) {
      if (!manualKisaTouched) {
        el.kisa.value = '';
        activeCandidateKey = '';
      }
      return;
    }
    if (manualKisaTouched) return;
    if (candidates.length === 1) {
      el.kisa.value = candidates[0].kisa.toFixed(2);
      activeCandidateKey = candidateKey(candidates[0]);
    } else {
      el.kisa.value = '';
      activeCandidateKey = '';
    }
  }
  function saveInputs(){
    safeSet(STORAGE_KEYS.lastInputs, JSON.stringify({
      reading: el.reading.value,
      temp: el.temp.value,
      kisa: el.kisa.value,
      candidateKey: activeCandidateKey,
      hydrometer: el.hydrometer.value
    }));
  }
  function restoreInputs(){
    const raw = safeGet(STORAGE_KEYS.lastInputs);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        if (saved.hydrometer && hydrometers.some(h => h.id === saved.hydrometer)) el.hydrometer.value = saved.hydrometer;
        if (saved.reading != null) el.reading.value = String(saved.reading);
        if (saved.temp != null) el.temp.value = String(saved.temp);
        if (saved.kisa != null) el.kisa.value = String(saved.kisa);
        if (saved.candidateKey != null) activeCandidateKey = String(saved.candidateKey);
        if (String(el.kisa.value || '').trim()) manualKisaTouched = true;
      }
    } catch(_err) {}
  }
  function interpolateValue(a, b, ratio){
    const aOk = Number.isFinite(a);
    const bOk = Number.isFinite(b);
    if (aOk && bOk) return a + ((b - a) * ratio);
    if (aOk && !bOk && ratio < 1e-9) return a;
    if (bOk && !aOk && ratio > 1 - 1e-9) return b;
    return NaN;
  }
  function convertToFifteen(corrected, temp){
    if (!TEMP_TABLE) return NaN;
    if (!Number.isFinite(corrected) || !Number.isFinite(temp)) return NaN;
    if (temp < 0 || temp > 35 || corrected < 0 || corrected > 100) return NaN;
    const d0 = Math.floor(corrected);
    const d1 = Math.ceil(corrected);
    const t0 = Math.floor(temp);
    const t1 = Math.ceil(temp);
    const dr = d1 === d0 ? 0 : (corrected - d0) / (d1 - d0);
    const tr = t1 === t0 ? 0 : (temp - t0) / (t1 - t0);
    const v00 = TEMP_TABLE.value(d0, t0);
    const v10 = TEMP_TABLE.value(d1, t0);
    const v01 = TEMP_TABLE.value(d0, t1);
    const v11 = TEMP_TABLE.value(d1, t1);
    const vt0 = interpolateValue(v00, v10, dr);
    const vt1 = interpolateValue(v01, v11, dr);
    return interpolateValue(vt0, vt1, tr);
  }
  function showError(message){
    el.error.textContent = message || '';
    el.error.hidden = !message;
  }
  function updateTableLink(corrected, temp){
    const params = new URLSearchParams();
    if (Number.isFinite(corrected)) params.set('abv', roundTo(corrected, 2).toFixed(2));
    if (Number.isFinite(temp)) params.set('temp', roundTo(temp, 1).toFixed(1));
    params.set('back', 'alcohol-conversion.html');
    el.tableLink.href = './docs-view.html?' + params.toString();
  }
  function updateResult(corrected){
    if (Number.isFinite(corrected)) {
      el.correctedCard.hidden = false;
      el.corrected.textContent = formatPlain(roundTo(corrected, 2), 2);
      if (el.result) el.result.hidden = false;
    } else {
      el.correctedCard.hidden = true;
      el.corrected.textContent = '—';
      if (el.result) el.result.hidden = true;
    }
    if (el.final) el.final.textContent = '—';
  }
  function valueEntered(input){ return !!String(input && input.value || '').trim(); }
  function buildErrorMessage(reading, temp, kisa, hydrometer, corrected){
    const hasReading = valueEntered(el.reading);
    const hasTemp = valueEntered(el.temp);
    const hasKisa = valueEntered(el.kisa);
    if (hasReading && !Number.isFinite(reading)) return '測定度数を確認してください。';
    if (hasTemp && !Number.isFinite(temp)) return '測定温度を確認してください。';
    if (hasKisa && !Number.isFinite(kisa)) return '器差を確認してください。';
    if (hasReading && hydrometer && Number.isFinite(reading) && (reading < Number(hydrometer.min) || reading > Number(hydrometer.max))) {
      return '選択中の浮標範囲外です。';
    }
    if (hasReading && hasTemp && hasKisa && (!Number.isFinite(corrected) || corrected < 0 || corrected > 100)) return '補正後示度が表の範囲外です。';
    if (hasTemp && Number.isFinite(temp) && (temp < 0 || temp > 35)) return '測定温度が表の範囲外です。';
    return '';
  }
  function updateAll(){
    const reading = numberValue(el.reading);
    const temp = numberValue(el.temp);
    const hydrometer = selectedHydrometer();
    const points = getRegisteredKisaPoints(hydrometer);
    const hydrometerInRange = !!(hydrometer && Number.isFinite(reading) && reading >= Number(hydrometer.min) && reading <= Number(hydrometer.max));
    const candidates = hydrometerInRange ? getKisaCandidates(reading, hydrometer) : [];
    if (hydrometerInRange) {
      pickDefaultCandidate(reading, candidates);
    } else if (!manualKisaTouched) {
      el.kisa.value = '';
      activeCandidateKey = '';
    }
    renderCandidates(points, candidates);
    const kisa = numberValue(el.kisa);
    const corrected = Number.isFinite(reading) && Number.isFinite(kisa) && hydrometerInRange ? reading - kisa : NaN;
    updateTableLink(corrected, temp);
    updateResult(corrected);
    showError(buildErrorMessage(reading, temp, kisa, hydrometer, corrected));
    saveInputs();
  }
  function resetAll(){
    manualKisaTouched = false;
    activeCandidateKey = '';
    el.reading.value = '';
    el.temp.value = '';
    el.kisa.value = '';
    updateAll();
  }
  function bindEvents(){
    el.reading.addEventListener('input', () => {
      manualKisaTouched = false;
      activeCandidateKey = '';
      updateAll();
    });
    el.reading.addEventListener('change', updateAll);
    el.temp.addEventListener('input', updateAll);
    el.temp.addEventListener('change', updateAll);
    if (el.kisa && el.kisa.type !== 'hidden') {
      el.kisa.addEventListener('input', () => { manualKisaTouched = true; activeCandidateKey = ''; updateAll(); });
      el.kisa.addEventListener('change', updateAll);
    }
    el.hydrometer.addEventListener('change', () => {
      safeSet(STORAGE_KEYS.lastHydrometer, el.hydrometer.value);
      manualKisaTouched = false;
      activeCandidateKey = '';
      el.kisa.value = '';
      updateAll();
    });
    el.reset.addEventListener('click', resetAll);
  }
  function init(){
    populateHydrometerOptions();
    restoreInputs();
    bindEvents();
    updateAll();
  }
  init();
})();
