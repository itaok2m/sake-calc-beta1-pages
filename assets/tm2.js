/* ===== 2mm表（beta1統合） ===== */
(function(){
  const root = document.getElementById('tm2-root');
  if(!root) return;
  const TM2_TANKS = [
    { tank_no:3, label:'No.3', group_label:'1〜20', full_l:6415, bottom_l:348, center_mm:1842, per_mm_l:3.29396, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:4, label:'No.4', group_label:'1〜20', full_l:6234, bottom_l:327, center_mm:1818, per_mm_l:3.24919, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'底板面以下は 337L ではなく 327L と確認済み。記載1mm当 3.24919 は原票記載どおり維持します。' },
    { tank_no:5, label:'No.5', group_label:'1〜20', full_l:6247, bottom_l:308, center_mm:1828, per_mm_l:3.24919, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:6, label:'No.6', group_label:'1〜20', full_l:6289, bottom_l:335, center_mm:1822, per_mm_l:3.26804, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:7, label:'No.7', group_label:'1〜20', full_l:6311, bottom_l:342, center_mm:1830, per_mm_l:3.26176, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:8, label:'No.8', group_label:'1〜20', full_l:6363, bottom_l:345, center_mm:1838, per_mm_l:3.27433, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:9, label:'No.9', group_label:'1〜20', full_l:6354, bottom_l:356, center_mm:1832, per_mm_l:3.27433, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:10, label:'No.10', group_label:'1〜20', full_l:6072, bottom_l:286, center_mm:1764, per_mm_l:3.28061, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:11, label:'No.11', group_label:'1〜20', full_l:6048, bottom_l:310, center_mm:1756, per_mm_l:3.26804, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:12, label:'No.12', group_label:'1〜20', full_l:6358, bottom_l:358, center_mm:1858, per_mm_l:3.22956, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:13, label:'No.13', group_label:'1〜20', full_l:6437, bottom_l:355, center_mm:1872, per_mm_l:3.24919, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:14, label:'No.14', group_label:'1〜20', full_l:6447, bottom_l:360, center_mm:1870, per_mm_l:3.25548, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:15, label:'No.15', group_label:'1〜20', full_l:6456, bottom_l:348, center_mm:1880, per_mm_l:3.24919, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:40, label:'No.40', group_label:'21〜40', full_l:7034, bottom_l:465, center_mm:1926, per_mm_l:3.41099, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:41, label:'No.41', group_label:'41〜60', full_l:7074, bottom_l:440, center_mm:1938, per_mm_l:3.42355, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:42, label:'No.42', group_label:'41〜60', full_l:7066, bottom_l:349, center_mm:1958, per_mm_l:3.43062, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'うっすら 6717 の記載あり。7066 側にチェックあり。' },
    { tank_no:43, label:'No.43', group_label:'41〜60', full_l:7718, bottom_l:483, center_mm:1964, per_mm_l:3.68431, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'うっすら 7235 の記載あり。全容量にチェックあり。1mm当の末尾 31 は書き足しに見える。' },
    { tank_no:45, label:'No.45', group_label:'41〜60', full_l:7695, bottom_l:470, center_mm:1954, per_mm_l:3.69766, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'うっすら 7225 の記載あり。全容量にチェックあり。1mm当末尾 66 は追加に見える。' },
    { tank_no:46, label:'No.46', group_label:'41〜60', full_l:7700, bottom_l:453, center_mm:1960, per_mm_l:3.69766, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'7700 にチェックあり。うっすら 7247 の記載あり。1mm当末尾 66 は追加に見える。' },
    { tank_no:59, label:'No.59', group_label:'41〜60', full_l:2275, bottom_l:105, center_mm:1352, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.59 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量2275L / 底板面以下105L / 中心深1352mm。容器検定簿の累計行をまとめず、紙面と同じ行単位で登録表示します。尺0の計算値は 2275L で、全容量2275L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:184, start_l:105, end_l:405, recorded_per_mm_l:1.630 },
      { start_depth_mm:184, end_depth_mm:366, start_l:405, end_l:705, recorded_per_mm_l:1.648 },
      { start_depth_mm:366, end_depth_mm:550, start_l:705, end_l:1005, recorded_per_mm_l:1.630 },
      { start_depth_mm:550, end_depth_mm:734, start_l:1005, end_l:1305, recorded_per_mm_l:1.630 },
      { start_depth_mm:734, end_depth_mm:916, start_l:1305, end_l:1605, recorded_per_mm_l:1.648 },
      { start_depth_mm:916, end_depth_mm:1100, start_l:1605, end_l:1905, recorded_per_mm_l:1.630 },
      { start_depth_mm:1100, end_depth_mm:1192, start_l:1905, end_l:2055, recorded_per_mm_l:1.630 },
      { start_depth_mm:1192, end_depth_mm:1198, start_l:2055, end_l:2065, recorded_per_mm_l:1.666 },
      { start_depth_mm:1198, end_depth_mm:1204, start_l:2065, end_l:2075, recorded_per_mm_l:1.666 },
      { start_depth_mm:1204, end_depth_mm:1210, start_l:2075, end_l:2085, recorded_per_mm_l:1.666 },
      { start_depth_mm:1210, end_depth_mm:1216, start_l:2085, end_l:2095, recorded_per_mm_l:1.666 },
      { start_depth_mm:1216, end_depth_mm:1222, start_l:2095, end_l:2105, recorded_per_mm_l:1.666 },
      { start_depth_mm:1222, end_depth_mm:1228, start_l:2105, end_l:2115, recorded_per_mm_l:1.666 },
      { start_depth_mm:1228, end_depth_mm:1234, start_l:2115, end_l:2125, recorded_per_mm_l:1.666 },
      { start_depth_mm:1234, end_depth_mm:1240, start_l:2125, end_l:2135, recorded_per_mm_l:1.666 },
      { start_depth_mm:1240, end_depth_mm:1246, start_l:2135, end_l:2145, recorded_per_mm_l:1.666 },
      { start_depth_mm:1246, end_depth_mm:1252, start_l:2145, end_l:2155, recorded_per_mm_l:1.666 },
      { start_depth_mm:1252, end_depth_mm:1258, start_l:2155, end_l:2165, recorded_per_mm_l:1.666 },
      { start_depth_mm:1258, end_depth_mm:1266, start_l:2165, end_l:2175, recorded_per_mm_l:1.250 },
      { start_depth_mm:1266, end_depth_mm:1272, start_l:2175, end_l:2185, recorded_per_mm_l:1.666 },
      { start_depth_mm:1272, end_depth_mm:1278, start_l:2185, end_l:2195, recorded_per_mm_l:1.666 },
      { start_depth_mm:1278, end_depth_mm:1284, start_l:2195, end_l:2205, recorded_per_mm_l:1.666 },
      { start_depth_mm:1284, end_depth_mm:1292, start_l:2205, end_l:2215, recorded_per_mm_l:1.250 },
      { start_depth_mm:1292, end_depth_mm:1298, start_l:2215, end_l:2225, recorded_per_mm_l:1.666 },
      { start_depth_mm:1298, end_depth_mm:1306, start_l:2225, end_l:2235, recorded_per_mm_l:1.250 },
      { start_depth_mm:1306, end_depth_mm:1316, start_l:2235, end_l:2245, recorded_per_mm_l:1.000 },
      { start_depth_mm:1316, end_depth_mm:1328, start_l:2245, end_l:2255, recorded_per_mm_l:0.833 },
      { start_depth_mm:1328, end_depth_mm:1340, start_l:2255, end_l:2265, recorded_per_mm_l:0.833 },
      { start_depth_mm:1340, end_depth_mm:1352, start_l:2265, end_l:2275, recorded_per_mm_l:0.833 }
    ] },
    { tank_no:60, label:'No.60', group_label:'41〜60', full_l:2275, bottom_l:115, center_mm:1280, per_mm_l:1.68782, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:61, label:'No.61', group_label:'61〜80', full_l:2178, bottom_l:135, center_mm:1228, per_mm_l:1.66426, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:62, label:'No.62', group_label:'61〜80', full_l:2068, bottom_l:99, center_mm:1356, per_mm_l:1.45220, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:63, label:'No.63', group_label:'61〜80', full_l:2257, bottom_l:109, center_mm:1280, per_mm_l:1.67839, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:66, label:'No.66', group_label:'61〜80', full_l:1078, bottom_l:47, center_mm:990, per_mm_l:1.042, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'記載1mm当が他タンクより少ない桁数で記載されている。原票記載どおり 1.042 を採用する。計算整合は大きく崩れていないが、重点検査対象とする。' },
    { tank_no:67, label:'No.67', group_label:'61〜80', full_l:1157, bottom_l:53, center_mm:1046, per_mm_l:1.05636, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:68, label:'No.68', group_label:'61〜80', full_l:1157, bottom_l:59, center_mm:1040, per_mm_l:1.05636, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:71, label:'No.71', group_label:'61〜80', full_l:428, bottom_l:16, center_mm:774, per_mm_l:0.53250, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:70, label:'No.70', group_label:'61〜80', full_l:423, bottom_l:12, center_mm:780, per_mm_l:0.52778, source_note:'監査用生成条件', audit_enabled:true, audit_note:'現場運用は紙の2mm表を正本として 12L を採用する。容器検定簿では底板面以下 13L の記載があるため、差分確認用に残す。' },
    { tank_no:73, label:'No.73', group_label:'61〜80', full_l:454, bottom_l:23, center_mm:736, per_mm_l:0.58590, source_note:'監査用生成条件', audit_enabled:true, audit_note:'現場運用は紙の2mm表を正本として 23L を採用する。容器検定簿では底板面以下 22L の記載があるため、差分確認用に残す。' },
    { tank_no:82, label:'No.82', group_label:'81〜100', full_l:673, bottom_l:18, center_mm:898, per_mm_l:0.72963, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:83, label:'No.83', group_label:'81〜100', full_l:671, bottom_l:19, center_mm:890, per_mm_l:0.73277, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:88, label:'No.88', group_label:'81〜100', full_l:668, bottom_l:16, center_mm:894, per_mm_l:0.72963, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:89, label:'No.89', group_label:'81〜100', full_l:660, bottom_l:18, center_mm:880, per_mm_l:0.72963, source_note:'監査用生成条件', audit_enabled:true, audit_note:'現場運用は紙の2mm表を正本として 18L を採用する。容器検定簿では底板面以下 17L の記載があるため、差分確認用に残す。' },
    { tank_no:90, label:'No.90', group_label:'81〜100', full_l:663, bottom_l:17, center_mm:882, per_mm_l:0.73277, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:92, label:'No.92', group_label:'81〜100', full_l:660, bottom_l:17, center_mm:878, per_mm_l:0.73277, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:98, label:'No.98', group_label:'81〜100', full_l:653, bottom_l:26, center_mm:860, per_mm_l:0.72963, source_note:'原票記載の固定1mm当', audit_enabled:true, audit_note:'' },
    { tank_no:111, label:'No.111', group_label:'101〜120', full_l:2258, bottom_l:105, center_mm:1294, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.111 は区間差分から1mm当を再計算する方式です。複数検定区画。尺0の計算値は 2258L で、全容量2258L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:206, start_l:105, end_l:458, recorded_per_mm_l:1.713 },
      { start_depth_mm:206, end_depth_mm:388, start_l:458, end_l:758, recorded_per_mm_l:1.648 },
      { start_depth_mm:388, end_depth_mm:570, start_l:758, end_l:1058, recorded_per_mm_l:1.648 },
      { start_depth_mm:570, end_depth_mm:750, start_l:1058, end_l:1358, recorded_per_mm_l:1.666 },
      { start_depth_mm:750, end_depth_mm:930, start_l:1358, end_l:1658, recorded_per_mm_l:1.666 },
      { start_depth_mm:930, end_depth_mm:1112, start_l:1658, end_l:1958, recorded_per_mm_l:1.648 },
      { start_depth_mm:1112, end_depth_mm:1294, start_l:1958, end_l:2258, recorded_per_mm_l:1.648 }
    ] },
    { tank_no:112, label:'No.112', group_label:'101〜120', full_l:3225, bottom_l:189, center_mm:1786, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.112 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量3225L / 底板面以下189L / 中心深1786mm。全深1816mm記載あり。30mm下を0とする旨の記載あり。尺0の計算値は 3225L で、全容量3225L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:34, start_l:189, end_l:245, recorded_per_mm_l:1.647 },
      { start_depth_mm:34, end_depth_mm:202, start_l:245, end_l:545, recorded_per_mm_l:1.785 },
      { start_depth_mm:202, end_depth_mm:372, start_l:545, end_l:845, recorded_per_mm_l:1.764 },
      { start_depth_mm:372, end_depth_mm:540, start_l:845, end_l:1145, recorded_per_mm_l:1.785 },
      { start_depth_mm:540, end_depth_mm:708, start_l:1145, end_l:1445, recorded_per_mm_l:1.785 },
      { start_depth_mm:708, end_depth_mm:876, start_l:1445, end_l:1745, recorded_per_mm_l:1.785 },
      { start_depth_mm:876, end_depth_mm:1046, start_l:1745, end_l:2045, recorded_per_mm_l:1.764 },
      { start_depth_mm:1046, end_depth_mm:1216, start_l:2045, end_l:2345, recorded_per_mm_l:1.764 },
      { start_depth_mm:1216, end_depth_mm:1386, start_l:2345, end_l:2645, recorded_per_mm_l:1.764 },
      { start_depth_mm:1386, end_depth_mm:1556, start_l:2645, end_l:2945, recorded_per_mm_l:1.764 },
      { start_depth_mm:1556, end_depth_mm:1562, start_l:2945, end_l:2955, recorded_per_mm_l:1.666 },
      { start_depth_mm:1562, end_depth_mm:1568, start_l:2955, end_l:2965, recorded_per_mm_l:1.666 },
      { start_depth_mm:1568, end_depth_mm:1574, start_l:2965, end_l:2975, recorded_per_mm_l:1.666 },
      { start_depth_mm:1574, end_depth_mm:1578, start_l:2975, end_l:2985, recorded_per_mm_l:2.500 },
      { start_depth_mm:1578, end_depth_mm:1584, start_l:2985, end_l:2995, recorded_per_mm_l:1.666 },
      { start_depth_mm:1584, end_depth_mm:1588, start_l:2995, end_l:3005, recorded_per_mm_l:2.500 },
      { start_depth_mm:1588, end_depth_mm:1594, start_l:3005, end_l:3015, recorded_per_mm_l:1.666 },
      { start_depth_mm:1594, end_depth_mm:1600, start_l:3015, end_l:3025, recorded_per_mm_l:1.666 },
      { start_depth_mm:1600, end_depth_mm:1606, start_l:3025, end_l:3035, recorded_per_mm_l:1.666 },
      { start_depth_mm:1606, end_depth_mm:1612, start_l:3035, end_l:3045, recorded_per_mm_l:1.666 },
      { start_depth_mm:1612, end_depth_mm:1616, start_l:3045, end_l:3055, recorded_per_mm_l:2.500 },
      { start_depth_mm:1616, end_depth_mm:1620, start_l:3055, end_l:3065, recorded_per_mm_l:2.500 },
      { start_depth_mm:1620, end_depth_mm:1630, start_l:3065, end_l:3075, recorded_per_mm_l:1.000 },
      { start_depth_mm:1630, end_depth_mm:1636, start_l:3075, end_l:3085, recorded_per_mm_l:1.666 },
      { start_depth_mm:1636, end_depth_mm:1642, start_l:3085, end_l:3095, recorded_per_mm_l:1.666 },
      { start_depth_mm:1642, end_depth_mm:1648, start_l:3095, end_l:3105, recorded_per_mm_l:1.666 },
      { start_depth_mm:1648, end_depth_mm:1654, start_l:3105, end_l:3115, recorded_per_mm_l:1.666 },
      { start_depth_mm:1654, end_depth_mm:1660, start_l:3115, end_l:3125, recorded_per_mm_l:1.666 },
      { start_depth_mm:1660, end_depth_mm:1666, start_l:3125, end_l:3135, recorded_per_mm_l:1.666 },
      { start_depth_mm:1666, end_depth_mm:1672, start_l:3135, end_l:3145, recorded_per_mm_l:1.666 },
      { start_depth_mm:1672, end_depth_mm:1678, start_l:3145, end_l:3155, recorded_per_mm_l:1.666 },
      { start_depth_mm:1678, end_depth_mm:1692, start_l:3155, end_l:3165, recorded_per_mm_l:0.714 },
      { start_depth_mm:1692, end_depth_mm:1702, start_l:3165, end_l:3175, recorded_per_mm_l:1.000 },
      { start_depth_mm:1702, end_depth_mm:1714, start_l:3175, end_l:3185, recorded_per_mm_l:0.833 },
      { start_depth_mm:1714, end_depth_mm:1726, start_l:3185, end_l:3195, recorded_per_mm_l:0.833 },
      { start_depth_mm:1726, end_depth_mm:1740, start_l:3195, end_l:3205, recorded_per_mm_l:0.714 },
      { start_depth_mm:1740, end_depth_mm:1761, start_l:3205, end_l:3215, recorded_per_mm_l:0.476 },
      { start_depth_mm:1761, end_depth_mm:1786, start_l:3215, end_l:3225, recorded_per_mm_l:0.400 }
    ] },
    { tank_no:117, label:'No.117', group_label:'101〜120', full_l:642, bottom_l:7, center_mm:886, per_mm_l:0.71707, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:126, label:'No.126', group_label:'121〜140', full_l:10113, bottom_l:613, center_mm:2406, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.126 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量10113L / 底板面以下613L / 中心深2406mm。容器検定簿は三帯構成で、左帯最下段 2192 / 9713 / 3.571 の続きが右帯 2208 / 9763 / 3.125 です。尺0の計算値は 10113L で、全容量10113L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:600, start_l:613, end_l:3113, recorded_per_mm_l:4.166 },
      { start_depth_mm:600, end_depth_mm:1318, start_l:3113, end_l:6113, recorded_per_mm_l:4.178 },
      { start_depth_mm:1318, end_depth_mm:2044, start_l:6113, end_l:9113, recorded_per_mm_l:4.132 },
      { start_depth_mm:2044, end_depth_mm:2056, start_l:9113, end_l:9163, recorded_per_mm_l:4.166 },
      { start_depth_mm:2056, end_depth_mm:2068, start_l:9163, end_l:9213, recorded_per_mm_l:4.166 },
      { start_depth_mm:2068, end_depth_mm:2080, start_l:9213, end_l:9263, recorded_per_mm_l:4.166 },
      { start_depth_mm:2080, end_depth_mm:2092, start_l:9263, end_l:9313, recorded_per_mm_l:4.166 },
      { start_depth_mm:2092, end_depth_mm:2104, start_l:9313, end_l:9363, recorded_per_mm_l:4.166 },
      { start_depth_mm:2104, end_depth_mm:2116, start_l:9363, end_l:9413, recorded_per_mm_l:4.166 },
      { start_depth_mm:2116, end_depth_mm:2128, start_l:9413, end_l:9463, recorded_per_mm_l:4.166 },
      { start_depth_mm:2128, end_depth_mm:2140, start_l:9463, end_l:9513, recorded_per_mm_l:4.166 },
      { start_depth_mm:2140, end_depth_mm:2154, start_l:9513, end_l:9563, recorded_per_mm_l:3.571 },
      { start_depth_mm:2154, end_depth_mm:2166, start_l:9563, end_l:9613, recorded_per_mm_l:4.166 },
      { start_depth_mm:2166, end_depth_mm:2178, start_l:9613, end_l:9663, recorded_per_mm_l:4.166 },
      { start_depth_mm:2178, end_depth_mm:2192, start_l:9663, end_l:9713, recorded_per_mm_l:3.571 },
      { start_depth_mm:2192, end_depth_mm:2208, start_l:9713, end_l:9763, recorded_per_mm_l:3.125 },
      { start_depth_mm:2208, end_depth_mm:2224, start_l:9763, end_l:9813, recorded_per_mm_l:3.125 },
      { start_depth_mm:2224, end_depth_mm:2240, start_l:9813, end_l:9863, recorded_per_mm_l:3.125 },
      { start_depth_mm:2240, end_depth_mm:2258, start_l:9863, end_l:9913, recorded_per_mm_l:2.777 },
      { start_depth_mm:2258, end_depth_mm:2280, start_l:9913, end_l:9963, recorded_per_mm_l:2.272 },
      { start_depth_mm:2280, end_depth_mm:2306, start_l:9963, end_l:10013, recorded_per_mm_l:1.923 },
      { start_depth_mm:2306, end_depth_mm:2340, start_l:10013, end_l:10063, recorded_per_mm_l:1.470 },
      { start_depth_mm:2340, end_depth_mm:2406, start_l:10063, end_l:10113, recorded_per_mm_l:0.757 }
    ] },
    { tank_no:127, label:'No.127', group_label:'121〜140', full_l:10448, bottom_l:748, center_mm:2236, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.127 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量10448L / 底板面以下748L / 中心深2236mm。容器検定簿の読取りで 1248mm は 1246mm に修正済みです。第1帯末尾 2046 / 10048 / 3.571 の続きが第2帯先頭 2060 / 10098 / 3.571 です。尺0の計算値は 10448L で、全容量10448L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:586, start_l:748, end_l:3448, recorded_per_mm_l:4.607 },
      { start_depth_mm:586, end_depth_mm:1246, start_l:3448, end_l:6448, recorded_per_mm_l:4.545 },
      { start_depth_mm:1246, end_depth_mm:1908, start_l:6448, end_l:9448, recorded_per_mm_l:4.531 },
      { start_depth_mm:1908, end_depth_mm:1920, start_l:9448, end_l:9498, recorded_per_mm_l:4.166 },
      { start_depth_mm:1920, end_depth_mm:1930, start_l:9498, end_l:9548, recorded_per_mm_l:5.000 },
      { start_depth_mm:1930, end_depth_mm:1942, start_l:9548, end_l:9598, recorded_per_mm_l:4.166 },
      { start_depth_mm:1942, end_depth_mm:1952, start_l:9598, end_l:9648, recorded_per_mm_l:5.000 },
      { start_depth_mm:1952, end_depth_mm:1964, start_l:9648, end_l:9698, recorded_per_mm_l:4.166 },
      { start_depth_mm:1964, end_depth_mm:1974, start_l:9698, end_l:9748, recorded_per_mm_l:5.000 },
      { start_depth_mm:1974, end_depth_mm:1986, start_l:9748, end_l:9798, recorded_per_mm_l:4.166 },
      { start_depth_mm:1986, end_depth_mm:1996, start_l:9798, end_l:9848, recorded_per_mm_l:5.000 },
      { start_depth_mm:1996, end_depth_mm:2008, start_l:9848, end_l:9898, recorded_per_mm_l:4.166 },
      { start_depth_mm:2008, end_depth_mm:2020, start_l:9898, end_l:9948, recorded_per_mm_l:4.166 },
      { start_depth_mm:2020, end_depth_mm:2032, start_l:9948, end_l:9998, recorded_per_mm_l:4.166 },
      { start_depth_mm:2032, end_depth_mm:2046, start_l:9998, end_l:10048, recorded_per_mm_l:3.571 },
      { start_depth_mm:2046, end_depth_mm:2060, start_l:10048, end_l:10098, recorded_per_mm_l:3.571 },
      { start_depth_mm:2060, end_depth_mm:2076, start_l:10098, end_l:10148, recorded_per_mm_l:3.125 },
      { start_depth_mm:2076, end_depth_mm:2092, start_l:10148, end_l:10198, recorded_per_mm_l:3.125 },
      { start_depth_mm:2092, end_depth_mm:2110, start_l:10198, end_l:10248, recorded_per_mm_l:2.777 },
      { start_depth_mm:2110, end_depth_mm:2130, start_l:10248, end_l:10298, recorded_per_mm_l:2.500 },
      { start_depth_mm:2130, end_depth_mm:2154, start_l:10298, end_l:10348, recorded_per_mm_l:2.083 },
      { start_depth_mm:2154, end_depth_mm:2184, start_l:10348, end_l:10398, recorded_per_mm_l:1.666 },
      { start_depth_mm:2184, end_depth_mm:2236, start_l:10398, end_l:10448, recorded_per_mm_l:0.961 }
    ] },
    { tank_no:128, label:'No.128', group_label:'121〜140', full_l:10082, bottom_l:662, center_mm:2374, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_force_caution:true, audit_summary:'注意あり', audit_status_note:'第1区間は、区間端点 662L→2982L から再計算した1mm当 4.202898L/mm で計算しています。記載1mm当 4.393L/mm を使うと 662 + 552 × 4.393 = 3086.936L となり、終点2982Lより104.936L多くなります。紙2mm表の下部には 4.202 への修正痕跡があります。おそらく容器検定簿または登録値側の記載ミス・古い値混在です。', audit_note:'', segment_alerts:[
      { start_depth_mm:0, end_depth_mm:552, note:'第1区間は、区間端点 662L→2982L から再計算した1mm当 4.202898L/mm で計算しています。記載1mm当4.393L/mmを使うと 662 + 552 × 4.393 = 3086.936L となり、終点2982Lより104.936L多くなります。紙2mm表下部に4.202への修正痕跡があります。おそらくタンク登録簿側の記載ミス、または資料混在です。' }
    ], segments:[
      { start_depth_mm:0, end_depth_mm:552, start_l:662, end_l:2982, recorded_per_mm_l:4.393 },
      { start_depth_mm:552, end_depth_mm:1276, start_l:2982, end_l:5982, recorded_per_mm_l:4.143 },
      { start_depth_mm:1276, end_depth_mm:1998, start_l:5982, end_l:8982, recorded_per_mm_l:4.155 },
      { start_depth_mm:1998, end_depth_mm:2010, start_l:8982, end_l:9032, recorded_per_mm_l:4.166 },
      { start_depth_mm:2010, end_depth_mm:2022, start_l:9032, end_l:9082, recorded_per_mm_l:4.166 },
      { start_depth_mm:2022, end_depth_mm:2036, start_l:9082, end_l:9132, recorded_per_mm_l:3.571 },
      { start_depth_mm:2036, end_depth_mm:2050, start_l:9132, end_l:9182, recorded_per_mm_l:3.571 },
      { start_depth_mm:2050, end_depth_mm:2062, start_l:9182, end_l:9232, recorded_per_mm_l:4.166 },
      { start_depth_mm:2062, end_depth_mm:2072, start_l:9232, end_l:9282, recorded_per_mm_l:5.000 },
      { start_depth_mm:2072, end_depth_mm:2084, start_l:9282, end_l:9332, recorded_per_mm_l:4.166 },
      { start_depth_mm:2084, end_depth_mm:2096, start_l:9332, end_l:9382, recorded_per_mm_l:4.166 },
      { start_depth_mm:2096, end_depth_mm:2110, start_l:9382, end_l:9432, recorded_per_mm_l:3.571 },
      { start_depth_mm:2110, end_depth_mm:2122, start_l:9432, end_l:9482, recorded_per_mm_l:4.166 },
      { start_depth_mm:2122, end_depth_mm:2134, start_l:9482, end_l:9532, recorded_per_mm_l:4.166 },
      { start_depth_mm:2134, end_depth_mm:2146, start_l:9532, end_l:9582, recorded_per_mm_l:4.166 },
      { start_depth_mm:2146, end_depth_mm:2160, start_l:9582, end_l:9632, recorded_per_mm_l:3.571 },
      { start_depth_mm:2160, end_depth_mm:2176, start_l:9632, end_l:9682, recorded_per_mm_l:3.125 },
      { start_depth_mm:2176, end_depth_mm:2192, start_l:9682, end_l:9732, recorded_per_mm_l:3.125 },
      { start_depth_mm:2192, end_depth_mm:2208, start_l:9732, end_l:9782, recorded_per_mm_l:3.125 },
      { start_depth_mm:2208, end_depth_mm:2224, start_l:9782, end_l:9832, recorded_per_mm_l:3.125 },
      { start_depth_mm:2224, end_depth_mm:2244, start_l:9832, end_l:9882, recorded_per_mm_l:2.500 },
      { start_depth_mm:2244, end_depth_mm:2266, start_l:9882, end_l:9932, recorded_per_mm_l:2.272 },
      { start_depth_mm:2266, end_depth_mm:2292, start_l:9932, end_l:9982, recorded_per_mm_l:1.923 },
      { start_depth_mm:2292, end_depth_mm:2324, start_l:9982, end_l:10032, recorded_per_mm_l:1.562 },
      { start_depth_mm:2324, end_depth_mm:2374, start_l:10032, end_l:10082, recorded_per_mm_l:1.000 }
    ] },
    { tank_no:129, label:'No.129', group_label:'121〜140', full_l:10458, bottom_l:658, center_mm:2286, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.129 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量10458L / 底板面以下658L / 中心深2286mm。測定位置の手書きは「挟み口横」読取り候補ですが、今回差分では計算条件に使っていません。尺0の計算値は 10458L で、全容量10458L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:616, start_l:658, end_l:3458, recorded_per_mm_l:4.545 },
      { start_depth_mm:616, end_depth_mm:1276, start_l:3458, end_l:6458, recorded_per_mm_l:4.545 },
      { start_depth_mm:1276, end_depth_mm:1938, start_l:6458, end_l:9458, recorded_per_mm_l:4.531 },
      { start_depth_mm:1938, end_depth_mm:1948, start_l:9458, end_l:9508, recorded_per_mm_l:5.000 },
      { start_depth_mm:1948, end_depth_mm:1960, start_l:9508, end_l:9558, recorded_per_mm_l:4.166 },
      { start_depth_mm:1960, end_depth_mm:1970, start_l:9558, end_l:9608, recorded_per_mm_l:5.000 },
      { start_depth_mm:1970, end_depth_mm:1982, start_l:9608, end_l:9658, recorded_per_mm_l:4.166 },
      { start_depth_mm:1982, end_depth_mm:1992, start_l:9658, end_l:9708, recorded_per_mm_l:5.000 },
      { start_depth_mm:1992, end_depth_mm:2004, start_l:9708, end_l:9758, recorded_per_mm_l:4.166 },
      { start_depth_mm:2004, end_depth_mm:2014, start_l:9758, end_l:9808, recorded_per_mm_l:5.000 },
      { start_depth_mm:2014, end_depth_mm:2026, start_l:9808, end_l:9858, recorded_per_mm_l:4.166 },
      { start_depth_mm:2026, end_depth_mm:2038, start_l:9858, end_l:9908, recorded_per_mm_l:4.166 },
      { start_depth_mm:2038, end_depth_mm:2052, start_l:9908, end_l:9958, recorded_per_mm_l:3.571 },
      { start_depth_mm:2052, end_depth_mm:2066, start_l:9958, end_l:10008, recorded_per_mm_l:3.571 },
      { start_depth_mm:2066, end_depth_mm:2080, start_l:10008, end_l:10058, recorded_per_mm_l:3.571 },
      { start_depth_mm:2080, end_depth_mm:2096, start_l:10058, end_l:10108, recorded_per_mm_l:3.125 },
      { start_depth_mm:2096, end_depth_mm:2112, start_l:10108, end_l:10158, recorded_per_mm_l:3.125 },
      { start_depth_mm:2112, end_depth_mm:2128, start_l:10158, end_l:10208, recorded_per_mm_l:3.125 },
      { start_depth_mm:2128, end_depth_mm:2146, start_l:10208, end_l:10258, recorded_per_mm_l:2.777 },
      { start_depth_mm:2146, end_depth_mm:2168, start_l:10258, end_l:10308, recorded_per_mm_l:2.272 },
      { start_depth_mm:2168, end_depth_mm:2194, start_l:10308, end_l:10358, recorded_per_mm_l:1.923 },
      { start_depth_mm:2194, end_depth_mm:2226, start_l:10358, end_l:10408, recorded_per_mm_l:1.563 },
      { start_depth_mm:2226, end_depth_mm:2286, start_l:10408, end_l:10458, recorded_per_mm_l:0.833 }
    ] },
    { tank_no:130, label:'No.130', group_label:'121〜140', full_l:634, bottom_l:5, center_mm:892, per_mm_l:0.70528, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:131, label:'No.131', group_label:'121〜140', full_l:636, bottom_l:5, center_mm:896, per_mm_l:0.70528, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:132, label:'No.132', group_label:'121〜140', full_l:635, bottom_l:5, center_mm:894, per_mm_l:0.70528, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:133, label:'No.133', group_label:'121〜140', full_l:189, bottom_l:1, center_mm:670, per_mm_l:0.2806, source_note:'監査用生成条件', audit_enabled:true, audit_note:'' },
    { tank_no:140, label:'No.140', group_label:'121〜140', full_l:10163, bottom_l:863, center_mm:2360, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.140 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量10163L / 底板面以下863L / 中心深2360mm。2ページ構成 / 検尺口横 / 密閉タンク。尺0の計算値は 10163L で、全容量10163L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:142, start_l:863, end_l:1463, recorded_per_mm_l:4.225 },
      { start_depth_mm:142, end_depth_mm:284, start_l:1463, end_l:2063, recorded_per_mm_l:4.225 },
      { start_depth_mm:284, end_depth_mm:430, start_l:2063, end_l:2663, recorded_per_mm_l:4.109 },
      { start_depth_mm:430, end_depth_mm:574, start_l:2663, end_l:3263, recorded_per_mm_l:4.166 },
      { start_depth_mm:574, end_depth_mm:718, start_l:3263, end_l:3863, recorded_per_mm_l:4.166 },
      { start_depth_mm:718, end_depth_mm:862, start_l:3863, end_l:4463, recorded_per_mm_l:4.166 },
      { start_depth_mm:862, end_depth_mm:1008, start_l:4463, end_l:5063, recorded_per_mm_l:4.109 },
      { start_depth_mm:1008, end_depth_mm:1152, start_l:5063, end_l:5663, recorded_per_mm_l:4.166 },
      { start_depth_mm:1152, end_depth_mm:1296, start_l:5663, end_l:6263, recorded_per_mm_l:4.166 },
      { start_depth_mm:1296, end_depth_mm:1440, start_l:6263, end_l:6863, recorded_per_mm_l:4.166 },
      { start_depth_mm:1440, end_depth_mm:1584, start_l:6863, end_l:7463, recorded_per_mm_l:4.166 },
      { start_depth_mm:1584, end_depth_mm:1728, start_l:7463, end_l:8063, recorded_per_mm_l:4.166 },
      { start_depth_mm:1728, end_depth_mm:1872, start_l:8063, end_l:8663, recorded_per_mm_l:4.166 },
      { start_depth_mm:1872, end_depth_mm:2020, start_l:8663, end_l:9263, recorded_per_mm_l:4.054 },
      { start_depth_mm:2020, end_depth_mm:2024, start_l:9263, end_l:9283, recorded_per_mm_l:5.000 },
      { start_depth_mm:2024, end_depth_mm:2028, start_l:9283, end_l:9303, recorded_per_mm_l:5.000 },
      { start_depth_mm:2028, end_depth_mm:2034, start_l:9303, end_l:9323, recorded_per_mm_l:3.333 },
      { start_depth_mm:2034, end_depth_mm:2038, start_l:9323, end_l:9343, recorded_per_mm_l:5.000 },
      { start_depth_mm:2038, end_depth_mm:2042, start_l:9343, end_l:9363, recorded_per_mm_l:5.000 },
      { start_depth_mm:2042, end_depth_mm:2046, start_l:9363, end_l:9383, recorded_per_mm_l:5.000 },
      { start_depth_mm:2046, end_depth_mm:2050, start_l:9383, end_l:9403, recorded_per_mm_l:5.000 },
      { start_depth_mm:2050, end_depth_mm:2054, start_l:9403, end_l:9423, recorded_per_mm_l:5.000 },
      { start_depth_mm:2054, end_depth_mm:2060, start_l:9423, end_l:9443, recorded_per_mm_l:3.333 },
      { start_depth_mm:2060, end_depth_mm:2066, start_l:9443, end_l:9463, recorded_per_mm_l:3.333 },
      { start_depth_mm:2066, end_depth_mm:2072, start_l:9463, end_l:9483, recorded_per_mm_l:3.333 },
      { start_depth_mm:2072, end_depth_mm:2078, start_l:9483, end_l:9503, recorded_per_mm_l:3.333 },
      { start_depth_mm:2078, end_depth_mm:2082, start_l:9503, end_l:9523, recorded_per_mm_l:5.000 },
      { start_depth_mm:2082, end_depth_mm:2088, start_l:9523, end_l:9543, recorded_per_mm_l:3.333 },
      { start_depth_mm:2088, end_depth_mm:2094, start_l:9543, end_l:9563, recorded_per_mm_l:3.333 },
      { start_depth_mm:2094, end_depth_mm:2100, start_l:9563, end_l:9583, recorded_per_mm_l:3.333 },
      { start_depth_mm:2100, end_depth_mm:2104, start_l:9583, end_l:9603, recorded_per_mm_l:5.000 },
      { start_depth_mm:2104, end_depth_mm:2110, start_l:9603, end_l:9623, recorded_per_mm_l:3.333 },
      { start_depth_mm:2110, end_depth_mm:2114, start_l:9623, end_l:9643, recorded_per_mm_l:5.000 },
      { start_depth_mm:2114, end_depth_mm:2122, start_l:9643, end_l:9663, recorded_per_mm_l:2.500 },
      { start_depth_mm:2122, end_depth_mm:2126, start_l:9663, end_l:9683, recorded_per_mm_l:5.000 },
      { start_depth_mm:2126, end_depth_mm:2132, start_l:9683, end_l:9703, recorded_per_mm_l:3.333 },
      { start_depth_mm:2132, end_depth_mm:2138, start_l:9703, end_l:9723, recorded_per_mm_l:3.333 },
      { start_depth_mm:2138, end_depth_mm:2144, start_l:9723, end_l:9743, recorded_per_mm_l:3.333 },
      { start_depth_mm:2144, end_depth_mm:2152, start_l:9743, end_l:9763, recorded_per_mm_l:2.500 },
      { start_depth_mm:2152, end_depth_mm:2156, start_l:9763, end_l:9783, recorded_per_mm_l:5.000 },
      { start_depth_mm:2156, end_depth_mm:2164, start_l:9783, end_l:9803, recorded_per_mm_l:2.500 },
      { start_depth_mm:2164, end_depth_mm:2172, start_l:9803, end_l:9823, recorded_per_mm_l:2.500 },
      { start_depth_mm:2172, end_depth_mm:2178, start_l:9823, end_l:9843, recorded_per_mm_l:3.333 },
      { start_depth_mm:2178, end_depth_mm:2184, start_l:9843, end_l:9863, recorded_per_mm_l:3.333 },
      { start_depth_mm:2184, end_depth_mm:2192, start_l:9863, end_l:9883, recorded_per_mm_l:2.500 },
      { start_depth_mm:2192, end_depth_mm:2198, start_l:9883, end_l:9903, recorded_per_mm_l:3.333 },
      { start_depth_mm:2198, end_depth_mm:2208, start_l:9903, end_l:9923, recorded_per_mm_l:2.000 },
      { start_depth_mm:2208, end_depth_mm:2214, start_l:9923, end_l:9943, recorded_per_mm_l:3.333 },
      { start_depth_mm:2214, end_depth_mm:2224, start_l:9943, end_l:9963, recorded_per_mm_l:2.000 },
      { start_depth_mm:2224, end_depth_mm:2232, start_l:9963, end_l:9983, recorded_per_mm_l:2.500 },
      { start_depth_mm:2232, end_depth_mm:2242, start_l:9983, end_l:10003, recorded_per_mm_l:2.000 },
      { start_depth_mm:2242, end_depth_mm:2252, start_l:10003, end_l:10023, recorded_per_mm_l:2.000 },
      { start_depth_mm:2252, end_depth_mm:2262, start_l:10023, end_l:10043, recorded_per_mm_l:2.000 },
      { start_depth_mm:2262, end_depth_mm:2274, start_l:10043, end_l:10063, recorded_per_mm_l:1.666 },
      { start_depth_mm:2274, end_depth_mm:2286, start_l:10063, end_l:10083, recorded_per_mm_l:1.666 },
      { start_depth_mm:2286, end_depth_mm:2300, start_l:10083, end_l:10103, recorded_per_mm_l:1.428 },
      { start_depth_mm:2300, end_depth_mm:2316, start_l:10103, end_l:10123, recorded_per_mm_l:1.250 },
      { start_depth_mm:2316, end_depth_mm:2334, start_l:10123, end_l:10143, recorded_per_mm_l:1.111 },
      { start_depth_mm:2334, end_depth_mm:2360, start_l:10143, end_l:10163, recorded_per_mm_l:0.769 }
    ] },
    { tank_no:141, label:'No.141', group_label:'141〜160', full_l:10138, bottom_l:538, center_mm:2436, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.141 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量10138L / 底板面以下538L / 中心深2436mm。第1帯先頭 614 / 3088 / 4.153 はユーザー修正済み値を採用。尺0の計算値は 10138L で、全容量10138L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:614, start_l:538, end_l:3088, recorded_per_mm_l:4.153 },
      { start_depth_mm:614, end_depth_mm:1336, start_l:3088, end_l:6088, recorded_per_mm_l:4.155 },
      { start_depth_mm:1336, end_depth_mm:2064, start_l:6088, end_l:9088, recorded_per_mm_l:4.120 },
      { start_depth_mm:2064, end_depth_mm:2078, start_l:9088, end_l:9138, recorded_per_mm_l:3.571 },
      { start_depth_mm:2078, end_depth_mm:2088, start_l:9138, end_l:9188, recorded_per_mm_l:5.000 },
      { start_depth_mm:2088, end_depth_mm:2102, start_l:9188, end_l:9238, recorded_per_mm_l:3.571 },
      { start_depth_mm:2102, end_depth_mm:2112, start_l:9238, end_l:9288, recorded_per_mm_l:5.000 },
      { start_depth_mm:2112, end_depth_mm:2124, start_l:9288, end_l:9338, recorded_per_mm_l:4.166 },
      { start_depth_mm:2124, end_depth_mm:2136, start_l:9338, end_l:9388, recorded_per_mm_l:4.166 },
      { start_depth_mm:2136, end_depth_mm:2150, start_l:9388, end_l:9438, recorded_per_mm_l:3.571 },
      { start_depth_mm:2150, end_depth_mm:2162, start_l:9438, end_l:9488, recorded_per_mm_l:4.166 },
      { start_depth_mm:2162, end_depth_mm:2174, start_l:9488, end_l:9538, recorded_per_mm_l:4.166 },
      { start_depth_mm:2174, end_depth_mm:2188, start_l:9538, end_l:9588, recorded_per_mm_l:3.571 },
      { start_depth_mm:2188, end_depth_mm:2202, start_l:9588, end_l:9638, recorded_per_mm_l:3.571 },
      { start_depth_mm:2202, end_depth_mm:2216, start_l:9638, end_l:9688, recorded_per_mm_l:3.571 },
      { start_depth_mm:2216, end_depth_mm:2230, start_l:9688, end_l:9738, recorded_per_mm_l:3.571 },
      { start_depth_mm:2230, end_depth_mm:2246, start_l:9738, end_l:9788, recorded_per_mm_l:3.125 },
      { start_depth_mm:2246, end_depth_mm:2264, start_l:9788, end_l:9838, recorded_per_mm_l:2.777 },
      { start_depth_mm:2264, end_depth_mm:2284, start_l:9838, end_l:9888, recorded_per_mm_l:2.500 },
      { start_depth_mm:2284, end_depth_mm:2304, start_l:9888, end_l:9938, recorded_per_mm_l:2.500 },
      { start_depth_mm:2304, end_depth_mm:2326, start_l:9938, end_l:9988, recorded_per_mm_l:2.272 },
      { start_depth_mm:2326, end_depth_mm:2352, start_l:9988, end_l:10038, recorded_per_mm_l:1.923 },
      { start_depth_mm:2352, end_depth_mm:2384, start_l:10038, end_l:10088, recorded_per_mm_l:1.562 },
      { start_depth_mm:2384, end_depth_mm:2436, start_l:10088, end_l:10138, recorded_per_mm_l:0.961 }
    ] }
,
    { tank_no:142, label:'No.142', group_label:'141〜160', full_l:7727, bottom_l:387, center_mm:2298, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.142 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量7727L / 底板面以下387L / 中心深2298mm。手書き修正値を差分計算で照合し、2170 / 7527 / 1.666 と 2180 / 7547 / 2.000 を採用。2294 は斜線扱いで、中心深は 2298 を採用。尺0の計算値は 7727L で、全容量7727L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:240, start_l:387, end_l:1187, recorded_per_mm_l:3.333 },
      { start_depth_mm:240, end_depth_mm:844, start_l:1187, end_l:3187, recorded_per_mm_l:3.311 },
      { start_depth_mm:844, end_depth_mm:1446, start_l:3187, end_l:5187, recorded_per_mm_l:3.322 },
      { start_depth_mm:1446, end_depth_mm:2048, start_l:5187, end_l:7187, recorded_per_mm_l:3.322 },
      { start_depth_mm:2048, end_depth_mm:2054, start_l:7187, end_l:7207, recorded_per_mm_l:3.333 },
      { start_depth_mm:2054, end_depth_mm:2060, start_l:7207, end_l:7227, recorded_per_mm_l:3.333 },
      { start_depth_mm:2060, end_depth_mm:2068, start_l:7227, end_l:7247, recorded_per_mm_l:2.500 },
      { start_depth_mm:2068, end_depth_mm:2074, start_l:7247, end_l:7267, recorded_per_mm_l:3.333 },
      { start_depth_mm:2074, end_depth_mm:2080, start_l:7267, end_l:7287, recorded_per_mm_l:3.333 },
      { start_depth_mm:2080, end_depth_mm:2088, start_l:7287, end_l:7307, recorded_per_mm_l:2.500 },
      { start_depth_mm:2088, end_depth_mm:2094, start_l:7307, end_l:7327, recorded_per_mm_l:3.333 },
      { start_depth_mm:2094, end_depth_mm:2100, start_l:7327, end_l:7347, recorded_per_mm_l:3.333 },
      { start_depth_mm:2100, end_depth_mm:2108, start_l:7347, end_l:7367, recorded_per_mm_l:2.500 },
      { start_depth_mm:2108, end_depth_mm:2114, start_l:7367, end_l:7387, recorded_per_mm_l:3.333 },
      { start_depth_mm:2114, end_depth_mm:2120, start_l:7387, end_l:7407, recorded_per_mm_l:3.333 },
      { start_depth_mm:2120, end_depth_mm:2128, start_l:7407, end_l:7427, recorded_per_mm_l:2.500 },
      { start_depth_mm:2128, end_depth_mm:2134, start_l:7427, end_l:7447, recorded_per_mm_l:3.333 },
      { start_depth_mm:2134, end_depth_mm:2140, start_l:7447, end_l:7467, recorded_per_mm_l:3.333 },
      { start_depth_mm:2140, end_depth_mm:2148, start_l:7467, end_l:7487, recorded_per_mm_l:2.500 },
      { start_depth_mm:2148, end_depth_mm:2158, start_l:7487, end_l:7507, recorded_per_mm_l:2.000 },
      { start_depth_mm:2158, end_depth_mm:2170, start_l:7507, end_l:7527, recorded_per_mm_l:1.666 },
      { start_depth_mm:2170, end_depth_mm:2180, start_l:7527, end_l:7547, recorded_per_mm_l:2.000 },
      { start_depth_mm:2180, end_depth_mm:2188, start_l:7547, end_l:7567, recorded_per_mm_l:2.500 },
      { start_depth_mm:2188, end_depth_mm:2196, start_l:7567, end_l:7587, recorded_per_mm_l:2.500 },
      { start_depth_mm:2196, end_depth_mm:2208, start_l:7587, end_l:7607, recorded_per_mm_l:1.666 },
      { start_depth_mm:2208, end_depth_mm:2220, start_l:7607, end_l:7627, recorded_per_mm_l:1.666 },
      { start_depth_mm:2220, end_depth_mm:2232, start_l:7627, end_l:7647, recorded_per_mm_l:1.666 },
      { start_depth_mm:2232, end_depth_mm:2244, start_l:7647, end_l:7667, recorded_per_mm_l:1.666 },
      { start_depth_mm:2244, end_depth_mm:2262, start_l:7667, end_l:7687, recorded_per_mm_l:1.111 },
      { start_depth_mm:2262, end_depth_mm:2280, start_l:7687, end_l:7707, recorded_per_mm_l:1.111 },
      { start_depth_mm:2280, end_depth_mm:2298, start_l:7707, end_l:7727, recorded_per_mm_l:1.111 }
    ] }
,
    { tank_no:150, label:'No.150', group_label:'141〜160', full_l:1112, bottom_l:102, center_mm:1108, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.150 は区間差分から1mm当を再計算する方式です。複数検定区画。ユーザー確認済み値: 全容量1112L / 底板面以下102L / 中心深1108mm。尺0の計算値は 1112L で、全容量1112L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:304, start_l:102, end_l:392, recorded_per_mm_l:0.953 },
      { start_depth_mm:304, end_depth_mm:620, start_l:392, end_l:692, recorded_per_mm_l:0.949 },
      { start_depth_mm:620, end_depth_mm:934, start_l:692, end_l:992, recorded_per_mm_l:0.955 },
      { start_depth_mm:934, end_depth_mm:944, start_l:992, end_l:1002, recorded_per_mm_l:1.000 },
      { start_depth_mm:944, end_depth_mm:954, start_l:1002, end_l:1012, recorded_per_mm_l:1.000 },
      { start_depth_mm:954, end_depth_mm:964, start_l:1012, end_l:1022, recorded_per_mm_l:1.000 },
      { start_depth_mm:964, end_depth_mm:976, start_l:1022, end_l:1032, recorded_per_mm_l:0.833 },
      { start_depth_mm:976, end_depth_mm:986, start_l:1032, end_l:1042, recorded_per_mm_l:1.000 },
      { start_depth_mm:986, end_depth_mm:996, start_l:1042, end_l:1052, recorded_per_mm_l:1.000 },
      { start_depth_mm:996, end_depth_mm:1008, start_l:1052, end_l:1062, recorded_per_mm_l:0.833 },
      { start_depth_mm:1008, end_depth_mm:1020, start_l:1062, end_l:1072, recorded_per_mm_l:0.833 },
      { start_depth_mm:1020, end_depth_mm:1032, start_l:1072, end_l:1082, recorded_per_mm_l:0.833 },
      { start_depth_mm:1032, end_depth_mm:1048, start_l:1082, end_l:1092, recorded_per_mm_l:0.625 },
      { start_depth_mm:1048, end_depth_mm:1074, start_l:1092, end_l:1102, recorded_per_mm_l:0.384 },
      { start_depth_mm:1074, end_depth_mm:1108, start_l:1102, end_l:1112, recorded_per_mm_l:0.294 }
    ] }
,
    { tank_no:151, label:'No.151', group_label:'141〜160', full_l:1112, bottom_l:82, center_mm:1130, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.151 は区間差分から1mm当を再計算する方式です。複数検定区画。今回登録値: 全容量1112L / 底板面以下82L / 中心深1130mm。尺0の計算値は 1112L で、全容量1112L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:10, start_l:82, end_l:92, recorded_per_mm_l:1.000 },
      { start_depth_mm:10, end_depth_mm:326, start_l:92, end_l:392, recorded_per_mm_l:0.949 },
      { start_depth_mm:326, end_depth_mm:642, start_l:392, end_l:692, recorded_per_mm_l:0.949 },
      { start_depth_mm:642, end_depth_mm:956, start_l:692, end_l:992, recorded_per_mm_l:0.955 },
      { start_depth_mm:956, end_depth_mm:966, start_l:992, end_l:1002, recorded_per_mm_l:1.000 },
      { start_depth_mm:966, end_depth_mm:976, start_l:1002, end_l:1012, recorded_per_mm_l:1.000 },
      { start_depth_mm:976, end_depth_mm:986, start_l:1012, end_l:1022, recorded_per_mm_l:1.000 },
      { start_depth_mm:986, end_depth_mm:998, start_l:1022, end_l:1032, recorded_per_mm_l:0.833 },
      { start_depth_mm:998, end_depth_mm:1008, start_l:1032, end_l:1042, recorded_per_mm_l:1.000 },
      { start_depth_mm:1008, end_depth_mm:1018, start_l:1042, end_l:1052, recorded_per_mm_l:1.000 },
      { start_depth_mm:1018, end_depth_mm:1028, start_l:1052, end_l:1062, recorded_per_mm_l:1.000 },
      { start_depth_mm:1028, end_depth_mm:1040, start_l:1062, end_l:1072, recorded_per_mm_l:0.833 },
      { start_depth_mm:1040, end_depth_mm:1054, start_l:1072, end_l:1082, recorded_per_mm_l:0.714 },
      { start_depth_mm:1054, end_depth_mm:1070, start_l:1082, end_l:1092, recorded_per_mm_l:0.625 },
      { start_depth_mm:1070, end_depth_mm:1096, start_l:1092, end_l:1102, recorded_per_mm_l:0.384 },
      { start_depth_mm:1096, end_depth_mm:1130, start_l:1102, end_l:1112, recorded_per_mm_l:0.294 }
    ] }
    ,
    { tank_no:152, label:'No.152', group_label:'141〜160', full_l:2227, bottom_l:161, center_mm:1608, source_note:'容器検定簿の区間別記載（区間差分から1mm当を再計算）', segment_calc_mode:'boundary_recalc', segment_boundary_mode:'next_segment_on_end', audit_enabled:true, audit_note:'No.152 は区間差分から1mm当を再計算する方式です。複数検定区画。今回登録値: 全容量2227L / 底板面以下161L / 中心深1608mm。尺0の計算値は 2227L で、全容量2227L と一致します。', segments:[
      { start_depth_mm:0, end_depth_mm:48, start_l:161, end_l:227, recorded_per_mm_l:1.375 },
      { start_depth_mm:48, end_depth_mm:274, start_l:227, end_l:527, recorded_per_mm_l:1.327 },
      { start_depth_mm:274, end_depth_mm:498, start_l:527, end_l:827, recorded_per_mm_l:1.339 },
      { start_depth_mm:498, end_depth_mm:724, start_l:827, end_l:1127, recorded_per_mm_l:1.327 },
      { start_depth_mm:724, end_depth_mm:950, start_l:1127, end_l:1427, recorded_per_mm_l:1.327 },
      { start_depth_mm:950, end_depth_mm:1176, start_l:1427, end_l:1727, recorded_per_mm_l:1.327 },
      { start_depth_mm:1176, end_depth_mm:1402, start_l:1727, end_l:2027, recorded_per_mm_l:1.327 },
      { start_depth_mm:1402, end_depth_mm:1408, start_l:2027, end_l:2037, recorded_per_mm_l:1.666 },
      { start_depth_mm:1408, end_depth_mm:1416, start_l:2037, end_l:2047, recorded_per_mm_l:1.250 },
      { start_depth_mm:1416, end_depth_mm:1424, start_l:2047, end_l:2057, recorded_per_mm_l:1.250 },
      { start_depth_mm:1424, end_depth_mm:1432, start_l:2057, end_l:2067, recorded_per_mm_l:1.250 },
      { start_depth_mm:1432, end_depth_mm:1438, start_l:2067, end_l:2077, recorded_per_mm_l:1.666 },
      { start_depth_mm:1438, end_depth_mm:1446, start_l:2077, end_l:2087, recorded_per_mm_l:1.250 },
      { start_depth_mm:1446, end_depth_mm:1454, start_l:2087, end_l:2097, recorded_per_mm_l:1.250 },
      { start_depth_mm:1454, end_depth_mm:1462, start_l:2097, end_l:2107, recorded_per_mm_l:1.250 },
      { start_depth_mm:1462, end_depth_mm:1470, start_l:2107, end_l:2117, recorded_per_mm_l:1.250 },
      { start_depth_mm:1470, end_depth_mm:1478, start_l:2117, end_l:2127, recorded_per_mm_l:1.250 },
      { start_depth_mm:1478, end_depth_mm:1486, start_l:2127, end_l:2137, recorded_per_mm_l:1.250 },
      { start_depth_mm:1486, end_depth_mm:1494, start_l:2137, end_l:2147, recorded_per_mm_l:1.250 },
      { start_depth_mm:1494, end_depth_mm:1502, start_l:2147, end_l:2157, recorded_per_mm_l:1.250 },
      { start_depth_mm:1502, end_depth_mm:1510, start_l:2157, end_l:2167, recorded_per_mm_l:1.250 },
      { start_depth_mm:1510, end_depth_mm:1520, start_l:2167, end_l:2177, recorded_per_mm_l:1.000 },
      { start_depth_mm:1520, end_depth_mm:1532, start_l:2177, end_l:2187, recorded_per_mm_l:0.833 },
      { start_depth_mm:1532, end_depth_mm:1544, start_l:2187, end_l:2197, recorded_per_mm_l:0.833 },
      { start_depth_mm:1544, end_depth_mm:1562, start_l:2197, end_l:2207, recorded_per_mm_l:0.555 },
      { start_depth_mm:1562, end_depth_mm:1584, start_l:2207, end_l:2217, recorded_per_mm_l:0.454 },
      { start_depth_mm:1584, end_depth_mm:1608, start_l:2217, end_l:2227, recorded_per_mm_l:0.416 }
    ] }

  ];

  const $ = sel => root.querySelector(sel);
  const $$ = sel => Array.from(root.querySelectorAll(sel));
  const els = {
    mainPanel: $('[data-tm2-panel="main"]'),
    listPanel: $('[data-tm2-panel="list"]'),
    modeButtons: $$('[data-tm2-action="mode"]'),
    groupSelect: $('[data-tm2-role="group"]'),
    tankSelect: $('[data-tm2-role="tank"]'),
    currentCard: $('[data-tm2-role="current-card"]'),
    currentName: $('[data-tm2-role="current-name"]'),
    currentMeta: $('[data-tm2-role="current-meta"]'),
    currentRange: $('[data-tm2-role="current-range"]'),
    currentVolumeRange: $('[data-tm2-role="current-volume-range"]'),
    currentNote: $('[data-tm2-role="current-note"]'),
    shareCard: $('[data-tm2-role="share-card"]'),
    shareBody: $('[data-tm2-role="share-body"]'),
    shareToggle: $('[data-tm2-action="toggle-share"]'),
    v2DraftCard: $('[data-tm2-role="v2-draft-card"]'),
    v2DraftSource: $('[data-tm2-role="v2-draft-source"]'),
    v2DraftCandidates: $('[data-tm2-role="v2-draft-candidates"]'),
    v2DraftNote: $('[data-tm2-role="v2-draft-note"]'),
    shareMemoInput: $('#tm2_share_memo'),
    gaugeField: $('[data-tm2-field="gauge"]'),
    volumeField: $('[data-tm2-field="volume"]'),
    gaugeInput: $('[data-tm2-role="gauge"]'),
    volumeInput: $('[data-tm2-role="volume"]'),
    gaugeHelp: $('[data-tm2-role="gauge-help"]'),
    volumeHelp: $('[data-tm2-role="volume-help"]'),
    resultHeading: $('[data-tm2-role="result-heading"]'),
    resultValue: $('[data-tm2-role="result-value"]'),
    resultSubtext: $('[data-tm2-role="result-subtext"]'),
    auditStatus: $('[data-tm2-role="audit-status"]'),
    reasonToggle: $('[data-tm2-action="open-list-position"]'),
    reasonPanel: $('[data-tm2-role="reason-panel"]'),
    reasonGrid: $('[data-tm2-role="reason-grid"]'),
    auditToggle: $('[data-tm2-action="toggle-audit"]'),
    auditPanel: $('[data-tm2-role="audit-panel"]'),
    auditGrid: $('[data-tm2-role="audit-grid"]'),
    docsLinkBtn: $('[data-tm2-role="docs-link"]'),
    errorBox: $('[data-tm2-role="error"]'),
    openListBtn: $('[data-tm2-action="open-list"]'),
    listTitle: $('[data-tm2-role="list-title"]'),
    listNearby: $('[data-tm2-role="list-nearby"]'),
    listSearchHelpBody: $('[data-tm2-role="list-search-help-body"]'),
    listSearchHelpToggle: $('[data-tm2-action="toggle-list-search-help"]'),
    listBody: $('[data-tm2-role="list-body"]')
  };

  const TM2_STORAGE_KEY = 'sake-tools-tm2-state-v1';
  const TM2_RETURN_KEY = 'sake-tools-tm2-return-v1';
  const TM2_SCREEN_ID = 'tank2mm-screen';
  const TM2_CANDIDATE_KEY = 'sakeCalc.htmlSplit.tm2Candidate.v2.session';
  const TM2_SHARE_MEMO_KEY = 'sakeCalc.htmlSplit.tm2.shareMemo.v1';

  function tm2StorageGet(key){
    try{ return window.localStorage.getItem(key); }catch{ return null; }
  }
  function tm2StorageSet(key, value){
    try{ window.localStorage.setItem(key, value); return true; }catch{ return false; }
  }
  function tm2StorageRemove(key){
    try{ window.localStorage.removeItem(key); return true; }catch{ return false; }
  }
  function tm2ParseStoredObject(key){
    try{
      const raw = tm2StorageGet(key);
      if(!raw) return null;
      const value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    }catch{
      return null;
    }
  }
  function tm2SessionGet(key){
    try{ return window.sessionStorage.getItem(key); }catch{ return null; }
  }
  function tm2SessionRemove(key){
    try{ window.sessionStorage.removeItem(key); return true; }catch{ return false; }
  }
  function tm2SessionSet(key, value){
    try{ window.sessionStorage.setItem(key, value); return true; }catch{ return false; }
  }
  function normalizeValueItems(items){
    if(!Array.isArray(items)) return [];
    return items.map(item => {
      if(!item || typeof item !== 'object') return null;
      const label = String(item.label || '');
      const value = String(item.value || '');
      if(!label && !value) return null;
      return { label, value };
    }).filter(Boolean).slice(0, 8);
  }
  function escapeTm2Text(value){
    return String(value == null ? '' : value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char] || char));
  }
  function normalizeCompareText(value){
    return String(value == null ? '' : value).replace(/\s+/g, '').replace(/[：:]/g, '').trim();
  }
  function formatLiterTruncatedText(value, decimals=2){
    const raw = String(value == null ? '' : value).replace(/,/g, '').trim();
    const match = raw.match(/-?\d+(?:\.\d+)?/);
    if(match){
      const text = match[0];
      const negative = text.startsWith('-') ? '-' : '';
      const unsigned = negative ? text.slice(1) : text;
      const parts = unsigned.split('.');
      const whole = parts[0] || '0';
      const fraction = (parts[1] || '').slice(0, decimals).padEnd(decimals, '0');
      return decimals > 0 ? `${negative}${whole}.${fraction}` : `${negative}${whole}`;
    }
    const num = Number(value);
    if(!Number.isFinite(num)) return '';
    const scale = 10 ** decimals;
    return (Math.trunc(num * scale) / scale).toFixed(decimals);
  }
  function formatCandidateLiterDisplay(value){
    const text = formatLiterTruncatedText(value, 2);
    return text ? `${text}L` : '';
  }
  function normalizeLiterText(value){
    const text = formatLiterTruncatedText(value, 2);
    if(!text) return '';
    return String(Number(text));
  }
  function getCandidateLiterInputValue(candidate){
    const fromDisplay = formatLiterTruncatedText(candidate && candidate.displayValue, 2);
    if(fromDisplay) return fromDisplay;
    return formatLiterTruncatedText(candidate && candidate.liters, 2);
  }
  function isQuantityDetailLabel(label){
    return /数量|必要量|合計数量|現在量|仕上がり量|目標数量|投入後累計|割水前数量|添加前数量|添加前必要量/.test(String(label || ''));
  }
  function getDisplayDetailItems(candidate){
    const rawItems = Array.isArray(candidate && candidate.details) ? candidate.details : [];
    const seen = new Set();
    const mainLiter = normalizeLiterText(candidate && (candidate.displayValue || candidate.liters));
    return rawItems.filter(item => {
      if(!item) return false;
      const label = String(item.label || '');
      const value = String(item.value || '');
      if(!label && !value) return false;
      const key = normalizeCompareText(label + '|' + value);
      if(seen.has(key)) return false;
      seen.add(key);
      if(isQuantityDetailLabel(label) && mainLiter && normalizeLiterText(value) === mainLiter) return false;
      if(normalizeCompareText(value) && normalizeCompareText(value) === normalizeCompareText(candidate.label)) return false;
      return true;
    }).slice(0, 6);
  }

  const state = {
    mode:'gauge',
    selectedGroup:'',
    selectedTankNo:'',
    lastValidGauge:null,
    scrollTargetGauge:null,
    lastReasonCandidates:[],
    lastCalcDetail:null,
    auditOpen:false,
    reasonOpen:false,
    shareOpen:false
  };
  let incomingV2Draft = null;
  function normalizeIncomingV2Draft(raw){
    if(!raw || typeof raw !== 'object') return null;
    if(String(raw.type || '') !== 'tank2mm-v2-draft') return null;
    const source = raw.source && typeof raw.source === 'object' ? raw.source : {};
    const rawCandidates = Array.isArray(raw.allowedPayload?.literCandidates) ? raw.allowedPayload.literCandidates : [];
    const candidates = rawCandidates.map((item, index) => {
      const liters = Number(item?.liters);
      if(!Number.isFinite(liters) || liters < 0) return null;
      const component = Number(item?.component);
      return {
        index,
        role:String(item?.role || 'reference'),
        roleLabel:String(item?.roleLabel || item?.role_label || item?.role || '参考'),
        label:String(item?.label || '候補L'),
        liters,
        displayValue:formatCandidateLiterDisplay(item?.displayValue || item?.liters || liters),
        componentText:Number.isFinite(component) ? String(item?.componentText || component) : String(item?.componentText || ''),
        modeLabel:String(item?.modeLabel || source.calcTypeLabel || ''),
        details:normalizeValueItems(item?.details || item?.detailItems || [])
      };
    }).filter(Boolean).slice(0, 8);
    return {
      type:'tank2mm-v2-draft',
      status:String(raw.status || 'preview-only-no-send'),
      builtAtJst:String(raw.builtAtJst || ''),
      source:{
        scope:String(source.scope || 'current-calculation-screen'),
        toolKey:String(source.toolKey || ''),
        toolLabel:String(source.toolLabel || '計算画面'),
        calcTypeLabel:String(source.calcTypeLabel || '')
      },
      allowedPayload:{literCandidates:candidates}
    };
  }
  function renderIncomingV2Draft(){
    const draft = normalizeIncomingV2Draft(incomingV2Draft);
    incomingV2Draft = draft;
    if(!els.v2DraftCard || !els.v2DraftCandidates) return;
    if(!draft || !draft.allowedPayload.literCandidates.length){
      els.v2DraftCard.hidden = true;
      els.v2DraftCandidates.innerHTML = '';
      if(els.v2DraftSource) els.v2DraftSource.textContent = '候補はまだ受け取っていません。';
      return;
    }
    els.v2DraftCard.hidden = false;
    if(els.v2DraftSource){
      const time = draft.builtAtJst ? ` / ${draft.builtAtJst}` : '';
      els.v2DraftSource.textContent = `${draft.source.toolLabel}${time}`;
    }
    els.v2DraftCandidates.innerHTML = '';
    const indexedCandidates = draft.allowedPayload.literCandidates.map((candidate, index) => ({candidate, index}));
    const appendCandidateRow = (parent, item) => {
      const candidate = item.candidate;
      const row = document.createElement('div');
      const role = String(candidate.role || 'reference');
      row.className = `tm2-v2-draft-row is-role-${role}`;
      const name = document.createElement('div');
      name.className = 'tm2-v2-draft-name';
      const main = document.createElement('div');
      main.className = 'tm2-v2-draft-name-main';
      const roleBadge = document.createElement('span');
      roleBadge.className = 'tm2-v2-draft-role';
      roleBadge.textContent = candidate.roleLabel || role;
      const strong = document.createElement('strong');
      strong.textContent = candidate.displayValue || formatCandidateLiterDisplay(candidate.liters);
      const label = document.createElement('span');
      label.className = 'tm2-v2-draft-label';
      label.textContent = candidate.label;
      main.appendChild(roleBadge);
      if(candidate.modeLabel){
        const mode = document.createElement('span');
        mode.className = 'tm2-v2-draft-mode';
        mode.textContent = candidate.modeLabel;
        main.appendChild(mode);
      }
      main.appendChild(strong);
      name.appendChild(main);
      name.appendChild(label);
      if(candidate.componentText){
        const component = document.createElement('div');
        component.className = 'tm2-v2-draft-detail';
        component.textContent = '成分：' + candidate.componentText;
        name.appendChild(component);
      }
      const detailItems = getDisplayDetailItems(candidate);
      if(detailItems.length){
        const mini = document.createElement('div');
        mini.className = 'tm2-v2-draft-mini';
        mini.innerHTML = detailItems.map(detail => `<span>${escapeTm2Text(detail.label)} <strong>${escapeTm2Text(detail.value)}</strong></span>`).join('');
        name.appendChild(mini);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'back-btn tm2-v2-draft-apply';
      button.dataset.tm2Action = 'apply-v2-draft-candidate';
      button.dataset.tm2V2Index = String(item.index);
      button.textContent = 'L入力へ入れる';
      row.appendChild(name);
      row.appendChild(button);
      parent.appendChild(row);
    };
    indexedCandidates.forEach(item => appendCandidateRow(els.v2DraftCandidates, item));
  }
  function tm2Toast(message, options={}){
    const toastEl = document.getElementById('toast');
    if(!toastEl) return;
    const duration = Number.isFinite(Number(options.duration)) ? Number(options.duration) : 1800;
    toastEl.textContent = String(message || '');
    toastEl.classList.toggle('is-guide', options.kind === 'guide');
    toastEl.classList.add('show');
    window.clearTimeout(tm2Toast._timer);
    tm2Toast._timer = window.setTimeout(() => toastEl.classList.remove('show'), duration);
  }
  function tm2GuideToast(message){
    tm2Toast(message, {kind:'guide', duration:4600});
  }
  function setPseudoDisabled(el, disabled){
    if(!el) return;
    el.disabled = false;
    el.classList.toggle('is-disabled', Boolean(disabled));
    el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }
  function clearIncomingV2Draft(notify){
    incomingV2Draft = null;
    tm2SessionRemove(TM2_CANDIDATE_KEY);
    renderIncomingV2Draft();
    if(notify) tm2Toast('2mm表候補を消しました');
  }
  function applyIncomingV2DraftCandidate(index){
    const draft = normalizeIncomingV2Draft(incomingV2Draft);
    const candidate = draft?.allowedPayload?.literCandidates?.[Number(index)];
    if(!candidate){ tm2Toast('使える2mm表候補がありません'); return; }
    const tank = getSelectedTank();
    if(!tank){ tm2GuideToast('未入力があります。先にタンクを選択してください。'); return; }
    if(els.listPanel && !els.listPanel.hidden) closeList({save:false});
    setMode('volume', {save:false});
    els.volumeInput.value = getCandidateLiterInputValue(candidate);
    updateResult();
    saveTm2UiState({updateHistory:false});
    tm2Toast('候補LをL入力欄へ入れ、換算結果を表示しました');
  }
  function receiveIncomingV2Draft(rawDraft, options={}){
    incomingV2Draft = normalizeIncomingV2Draft(rawDraft);
    if(incomingV2Draft) tm2SessionSet(TM2_CANDIDATE_KEY, JSON.stringify(rawDraft));
    renderIncomingV2Draft();
    if(options.openShare !== true) setShareOpen(false, {save:false, updateHistory:false});
    if(els.listPanel && !els.listPanel.hidden) closeList({save:false});
    if(els.mainPanel) els.mainPanel.hidden = false;
    updateInputAvailability();
    updateResult();
    const candidates = incomingV2Draft?.allowedPayload?.literCandidates || [];
    return candidates.length > 0;
  }
  function getTm2Screen(){
    return root.closest('.screen') || document.getElementById(TM2_SCREEN_ID) || document.body;
  }
  function isTm2ScreenActive(){
    const screen = getTm2Screen();
    return !screen.classList.contains('screen') || screen.classList.contains('active');
  }
  function normalizeTm2Mode(mode){
    return mode === 'volume' ? 'volume' : 'gauge';
  }
  function normalizeTm2Boolean(value){
    return value === true || value === 1 || value === '1';
  }
  function normalizeTm2GaugeValue(value){
    if(value === undefined || value === null || value === '') return '';
    const num = Number(value);
    return Number.isFinite(num) ? String(num) : '';
  }
  function buildTm2UiStateFromCurrent(overrides={}){
    const mode = normalizeTm2Mode(overrides.mode ?? state.mode);
    const gaugeValue = String(overrides.gaugeValue ?? (els.gaugeInput?.value || ''));
    const volumeValue = String(overrides.volumeValue ?? (els.volumeInput?.value || ''));
    const activeGauge = normalizeTm2GaugeValue(overrides.activeGauge ?? state.lastValidGauge);
    const scrollTargetGauge = normalizeTm2GaugeValue(overrides.scrollTargetGauge ?? state.scrollTargetGauge ?? state.lastValidGauge);
    const groupKey = String((overrides.groupKey ?? overrides.selectedGroup ?? state.selectedGroup) || '');
    const tankNo = String((overrides.tankNo ?? overrides.selectedTankNo ?? state.selectedTankNo) || '');
    const listOpen = Object.prototype.hasOwnProperty.call(overrides, 'listOpen')
      ? normalizeTm2Boolean(overrides.listOpen)
      : Boolean(els.listPanel && !els.listPanel.hidden && els.mainPanel && els.mainPanel.hidden);
    const shareOpen = Object.prototype.hasOwnProperty.call(overrides, 'shareOpen')
      ? normalizeTm2Boolean(overrides.shareOpen)
      : Boolean(state.shareOpen);
    return {
      screen: TM2_SCREEN_ID,
      groupKey,
      tankNo,
      mode,
      inputValue: String((overrides.inputValue ?? (mode === 'volume' ? volumeValue : gaugeValue)) || ''),
      gaugeValue,
      volumeValue,
      activeGauge,
      listOpen,
      shareOpen,
      scrollTargetGauge,
      selectedGroup: groupKey,
      selectedTankNo: tankNo
    };
  }
  function normalizeTm2UiState(raw){
    if(!raw || typeof raw !== 'object') return null;
    const screen = String(raw.screen || TM2_SCREEN_ID || '');
    if(screen && screen !== TM2_SCREEN_ID) return null;
    const normalized = buildTm2UiStateFromCurrent({
      screen: TM2_SCREEN_ID,
      groupKey: raw.groupKey ?? raw.selectedGroup ?? raw.tm2group ?? '',
      tankNo: raw.tankNo ?? raw.selectedTankNo ?? raw.tm2tank ?? '',
      mode: raw.mode,
      gaugeValue: raw.gaugeValue ?? raw.tm2gauge ?? '',
      volumeValue: raw.volumeValue ?? raw.tm2volume ?? '',
      activeGauge: raw.activeGauge ?? raw.tm2activegauge ?? '',
      listOpen: raw.listOpen ?? raw.tm2list ?? false,
      shareOpen: raw.shareOpen ?? raw.tm2shareopen ?? false,
      scrollTargetGauge: raw.scrollTargetGauge ?? raw.tm2scrollgauge ?? raw.activeGauge ?? raw.tm2activegauge ?? '',
      inputValue: raw.inputValue ?? ''
    });
    const hasPayload = Boolean(
      normalized.groupKey ||
      normalized.tankNo ||
      normalized.gaugeValue ||
      normalized.volumeValue ||
      normalized.listOpen ||
      normalized.activeGauge ||
      normalized.scrollTargetGauge ||
      normalized.shareOpen ||
      normalized.mode === 'volume'
    );
    return hasPayload ? normalized : null;
  }
  function getTm2SavedState(){
    return normalizeTm2UiState(tm2ParseStoredObject(TM2_STORAGE_KEY));
  }

  function countDecimals(value){
    const str = String(value);
    if(!str.includes('.')) return 0;
    return str.split('.')[1].length;
  }
  const TM2_TANK_GROUP_RANGES = [
    { start: 3, end: 49, label: '3〜49' },
    { start: 50, end: 99, label: '50〜99' },
    { start: 100, end: 159, label: '100〜159' }
  ];
  function getTankSelectGroupLabel(tank){
    const tankNo = Number(tank?.tank_no);
    if(Number.isFinite(tankNo)){
      const matchedRange = TM2_TANK_GROUP_RANGES.find(range => tankNo >= range.start && tankNo <= range.end);
      if(matchedRange) return matchedRange.label;
      const start = Math.floor(tankNo / 10) * 10;
      return `${start}〜${start + 9}`;
    }
    return String(tank?.group_label || '');
  }
  function normalizeTankGroupLabel(groupLabel){
    const label = String(groupLabel || '').trim();
    if(!label) return '';
    if(TM2_TANK_GROUP_RANGES.some(range => range.label === label)) return label;
    const start = Number(label.split('〜')[0]);
    if(Number.isFinite(start)){
      const matchedRange = TM2_TANK_GROUP_RANGES.find(range => start >= range.start && start <= range.end);
      if(matchedRange) return matchedRange.label;
    }
    return label;
  }
  function getTankSelectGroupSortValue(groupLabel){
    const normalized = normalizeTankGroupLabel(groupLabel);
    const start = Number(String(normalized || '').split('〜')[0]);
    return Number.isFinite(start) ? start : 999999;
  }
  function getGroups(){
    return [...new Set(TM2_TANKS.map(tank => getTankSelectGroupLabel(tank)))]
      .sort((a,b) => getTankSelectGroupSortValue(a) - getTankSelectGroupSortValue(b));
  }
  function getTanksByGroup(groupLabel){
    return TM2_TANKS
      .filter(tank => getTankSelectGroupLabel(tank) === groupLabel)
      .sort((a,b) => a.tank_no - b.tank_no);
  }
  function getTankGroupOptionLabel(groupLabel){
    const count = getTanksByGroup(groupLabel).length;
    return `${groupLabel}（${count}件）`;
  }
  function getTankSelectOptionLabel(tank){
    const fullL = Number(tank?.full_l);
    const fullText = Number.isFinite(fullL) ? ` / ${fullL}L` : '';
    return `${tank.label}${fullText}`;
  }
  function getSelectedTank(){
    const tankNo = Number(state.selectedTankNo);
    return TM2_TANKS.find(tank => tank.tank_no === tankNo) || null;
  }

function getTankCalcModeKey(tank){
  if(usesBoundaryRecalcSegmentCalc(tank)) return 'segment_linear';
  if(usesRecordedPerMmSegmentCalc(tank)) return 'segment_recorded';
  if(isSegmentTank(tank)) return 'segment_linear';
  return 'fixed';
}
function getTankBoundaryModeKey(tank){
  if(!isSegmentTank(tank)) return 'none';
  return usesNextSegmentBoundaryMode(tank) ? 'next' : 'inclusive';
}
function getTankDocsUrl(tank){
  const tm2State = buildTm2UiStateFromCurrent();
  const params = new URLSearchParams({
    back:'tm2.html',
    returnScreen:TM2_SCREEN_ID,
    tankNo:String(tank.tank_no || ''),
    tankLabel:String(tank.label || ''),
    fullL:String(tank.full_l || ''),
    bottomL:String(tank.bottom_l || ''),
    centerMm:String(tank.center_mm || ''),
    calcMode:getTankCalcModeKey(tank),
    boundaryMode:getTankBoundaryModeKey(tank),
    tm2group:tm2State.groupKey,
    tm2tank:tm2State.tankNo,
    tm2mode:tm2State.mode,
    tm2gauge:tm2State.gaugeValue,
    tm2volume:tm2State.volumeValue,
    tm2list:tm2State.listOpen ? '1' : '0',
    tm2shareopen:tm2State.shareOpen ? '1' : '0',
    tm2activegauge:tm2State.activeGauge,
    tm2scrollgauge:tm2State.scrollTargetGauge,
    tm2input:tm2State.inputValue
  });
  if(Number.isFinite(Number(tank.per_mm_l))) params.set('perMm', String(tank.per_mm_l));
  if(tank.source_note) params.set('sourceNote', String(tank.source_note));
  if(tank.audit_note) params.set('auditNote', String(tank.audit_note));
  if(tank.audit_status_note) params.set('auditStatusNote', String(tank.audit_status_note));
  if(isSegmentTank(tank)){
    const segmentRows = tank.segments.map(segment => [
      segment.start_depth_mm,
      segment.end_depth_mm,
      segment.start_l,
      segment.end_l,
      Number(segment.recorded_per_mm_l)
    ].join(',')).join('|');
    params.set('segments', segmentRows);
    const alerts = Array.isArray(tank.segment_alerts) ? tank.segment_alerts : [];
    if(alerts.length){
      params.set('segmentAlerts', JSON.stringify(alerts));
    }
  }
  const backParams = new URLSearchParams();
  backParams.set('screen', TM2_SCREEN_ID);
  backParams.set('tm2return', '1');
  ['tm2group','tm2tank','tm2mode','tm2gauge','tm2volume','tm2list','tm2shareopen','tm2activegauge','tm2scrollgauge','tm2input'].forEach(key => {
    const value = params.get(key);
    if(value) backParams.set(key, value);
  });
  params.set('returnUrl', `./tm2.html?${backParams.toString()}`);
  return `./tm2-docs-view.html?${params.toString()}`;
}
function getTm2StateFromUrl(){
  try{
    const params = new URLSearchParams(location.search);
    const hasTm2Params = ['tm2group','tm2tank','tm2mode','tm2gauge','tm2volume','tm2list','tm2shareopen','tm2activegauge','tm2scrollgauge','tm2input'].some(key => params.has(key));
    const screen = params.get('screen') || '';
    const isTm2Return = params.get('tm2return') === '1';
    if(screen !== TM2_SCREEN_ID && !isTm2Return && !hasTm2Params) return null;
    if(screen && screen !== TM2_SCREEN_ID) return null;
    return normalizeTm2UiState({
      screen: TM2_SCREEN_ID,
      groupKey: params.get('tm2group') || '',
      tankNo: params.get('tm2tank') || '',
      mode: params.get('tm2mode') || 'gauge',
      gaugeValue: params.get('tm2gauge') || '',
      volumeValue: params.get('tm2volume') || '',
      listOpen: params.get('tm2list') || false,
      shareOpen: params.get('tm2shareopen') || false,
      activeGauge: params.get('tm2activegauge') || '',
      scrollTargetGauge: params.get('tm2scrollgauge') || params.get('tm2activegauge') || '',
      inputValue: params.get('tm2input') || ''
    });
  }catch{
    return null;
  }
}
function saveTm2UiState(options={}){
  const payload = buildTm2UiStateFromCurrent();
  try{ tm2StorageSet(TM2_STORAGE_KEY, JSON.stringify(payload)); }catch{}
  try{ syncDocsLink(getSelectedTank()); }catch{}
  if(options.updateHistory !== false && typeof window.syncCurrentBrowserHistoryState === 'function'){
    try{ window.syncCurrentBrowserHistoryState(); }catch{}
  }
  return payload;
}
function getTm2ReturnState(){
  try{ return normalizeTm2UiState(tm2ParseStoredObject(TM2_RETURN_KEY)); }catch{ return null; }
}
function saveTm2ReturnState(overrides={}){
  const payload = buildTm2UiStateFromCurrent(overrides);
  try{ tm2StorageSet(TM2_RETURN_KEY, JSON.stringify(payload)); }catch{}
  return payload;
}
function clearTm2ReturnState(){
  try{ tm2StorageRemove(TM2_RETURN_KEY); }catch{}
}
function clearTm2StoredState(){
  try{ tm2StorageRemove(TM2_STORAGE_KEY); }catch{}
  try{ tm2StorageRemove(TM2_RETURN_KEY); }catch{}
}
function resetTm2UiState(options={}){
  state.selectedGroup = '';
  state.selectedTankNo = '';
  state.lastValidGauge = null;
  state.scrollTargetGauge = null;
  state.auditOpen = false;
  state.reasonOpen = false;
  state.shareOpen = false;
  incomingV2Draft = null;
  renderIncomingV2Draft();
  state.lastReasonCandidates = [];
  state.lastCalcDetail = null;
  if(els.groupSelect) els.groupSelect.value = '';
  populateTanks('');
  if(els.tankSelect) els.tankSelect.value = '';
  if(els.gaugeInput) els.gaugeInput.value = '';
  if(els.volumeInput) els.volumeInput.value = '';
  if(els.mainPanel) els.mainPanel.hidden = false;
  if(els.listPanel){
    els.listPanel.hidden = true;
    delete els.listPanel.dataset.tm2ScrollGauge;
  }
  renderReasonGrid([]);
  syncReasonToggle();
  syncShareToggle();
  updateAuditView(null);
  setError('');
  updateInputAvailability();
  updateResult();
  try{ syncDocsLink(null); }catch{}
  if(options.clearStorage !== false) clearTm2StoredState();
  if(options.save){
    saveTm2UiState({updateHistory: options.updateHistory !== false});
  }
}
function getTm2StateFromHistory(historyState){
  try{
    const entryScreen = String(historyState?.screen || historyState?.uiState?.screen || '');
    if(entryScreen && entryScreen !== TM2_SCREEN_ID) return null;
    return normalizeTm2UiState(historyState?.tm2State || historyState?.uiState?.tm2State || null);
  }catch{
    return null;
  }
}
function resolveTm2UiState(options={}){
  const fromUrl = getTm2StateFromUrl();
  if(fromUrl){
    if(options.clearReturn !== false) clearTm2ReturnState();
    return fromUrl;
  }
  if(options.includeReturn !== false){
    const fromReturn = getTm2ReturnState();
    if(fromReturn){
      if(options.clearReturn !== false) clearTm2ReturnState();
      return fromReturn;
    }
  }
  const fromHistory = getTm2StateFromHistory(options.historyState ?? window.history.state);
  if(fromHistory) return fromHistory;
  return getTm2SavedState();
}
function applyTm2UiState(rawState, options={}){
  const saved = normalizeTm2UiState(rawState);
  if(!saved) return false;
  const groups = getGroups();
  const tankFromNumber = TM2_TANKS.find(tank => String(tank.tank_no) === String(saved.tankNo || '')) || null;
  const normalizedGroupKey = normalizeTankGroupLabel(saved.groupKey);
  const nextGroup = groups.includes(normalizedGroupKey) ? normalizedGroupKey : (tankFromNumber ? getTankSelectGroupLabel(tankFromNumber) : '');
  state.selectedGroup = nextGroup;
  els.groupSelect.value = nextGroup;
  populateTanks(nextGroup);
  const hasTank = nextGroup
    ? getTanksByGroup(nextGroup).some(tank => String(tank.tank_no) === String(saved.tankNo || ''))
    : false;
  state.selectedTankNo = hasTank ? String(saved.tankNo || '') : '';
  els.tankSelect.value = state.selectedTankNo;
  if(typeof saved.gaugeValue === 'string') els.gaugeInput.value = saved.gaugeValue;
  if(typeof saved.volumeValue === 'string') els.volumeInput.value = saved.volumeValue;
  const resolvedGauge = Number(saved.activeGauge || saved.scrollTargetGauge || '');
  state.lastValidGauge = Number.isFinite(resolvedGauge) ? resolvedGauge : null;
  state.scrollTargetGauge = Number.isFinite(resolvedGauge) ? resolvedGauge : null;
  state.reasonOpen = false;
  state.shareOpen = Boolean(saved.shareOpen);
  state.lastReasonCandidates = [];
  state.lastCalcDetail = null;
  setMode(saved.mode, {save:false});
  syncShareToggle();
  if(saved.listOpen && getSelectedTank()) openList({save:false, scheduleScroll:false});
  else closeList({save:false});
  if(saved.listOpen && getSelectedTank()){
    requestAnimationFrame(() => scrollTm2ListToHighlight());
  }
  try{ syncDocsLink(getSelectedTank()); }catch{}
  if(options.save){
    saveTm2UiState({updateHistory: options.updateHistory !== false});
  }
  if(options.clearReturn) clearTm2ReturnState();
  return true;
}
function restoreTm2UiState(options={}){
  const saved = resolveTm2UiState(options);
  if(!saved) return false;
  return applyTm2UiState(saved, {
    save: options.save === true,
    updateHistory: options.updateHistory !== false,
    clearReturn: options.clearReturn === true
  });
}
function openTankDocs(){
  const tank = getSelectedTank();
  if(!tank) return;
  saveTm2UiState();
  try{ saveUIState(); }catch{}
  window.location.href = getTankDocsUrl(tank);
}
function syncDocsLink(tank){
  if(!els.docsLinkBtn) return;
  if(tank){
    els.docsLinkBtn.href = getTankDocsUrl(tank);
    els.docsLinkBtn.classList.remove('is-disabled');
    els.docsLinkBtn.removeAttribute('aria-disabled');
    els.docsLinkBtn.tabIndex = 0;
  }else{
    els.docsLinkBtn.href = './tm2-docs-view.html';
    els.docsLinkBtn.classList.add('is-disabled');
    els.docsLinkBtn.setAttribute('aria-disabled','true');
    els.docsLinkBtn.tabIndex = -1;
  }
}
  function isSegmentTank(tank){
    return Boolean(tank && Array.isArray(tank.segments) && tank.segments.length);
  }
  function getTankDisplayDecimals(tank){
    if(isSegmentTank(tank)) return tank.segments.reduce((max, segment) => Math.max(max, countDecimals(segment.recorded_per_mm_l)), 0);
    return countDecimals(tank.per_mm_l);
  }
  function getTankLiquidDepth(tank, gaugeMm){
    return tank.center_mm - gaugeMm;
  }
  function usesBoundaryRecalcSegmentCalc(tank){
    return Boolean(tank && tank.segment_calc_mode === 'boundary_recalc');
  }
  function usesRecordedPerMmSegmentCalc(tank){
    return Boolean(tank && tank.segment_calc_mode === 'recorded_per_mm');
  }
  function usesNextSegmentBoundaryMode(tank){
    return Boolean(tank && tank.segment_boundary_mode === 'next_segment_on_end');
  }
  function getTankCalcMethodLabel(tank){
    if(usesBoundaryRecalcSegmentCalc(tank)){
      return '区間の始点Lと終点Lから1mm当を再計算';
    }
    if(usesRecordedPerMmSegmentCalc(tank)){
      return '区間の記載1mm当をそのまま使う計算';
    }
    return isSegmentTank(tank)
      ? '区間の前後をまっすぐ結んで計算'
      : '固定1mm当たり計算';
  }
  function getTankBoundaryLabel(tank){
    return usesNextSegmentBoundaryMode(tank)
      ? '1mm当は区間の終わりで次の値に切り替え'
      : '区間の端もその区間の値で計算';
  }
  function matchesSegmentLiquidDepth(tank, liquidDepth, segment, index){
    if(!usesNextSegmentBoundaryMode(tank)) return liquidDepth >= segment.start_depth_mm && liquidDepth <= segment.end_depth_mm;
    const isLast = index === tank.segments.length - 1;
    if(isLast) return liquidDepth >= segment.start_depth_mm && liquidDepth <= segment.end_depth_mm;
    return liquidDepth >= segment.start_depth_mm && liquidDepth < segment.end_depth_mm;
  }
  function getTankSegmentByLiquidDepth(tank, liquidDepth){
    if(!isSegmentTank(tank)) return null;
    return tank.segments.find((segment, index) => matchesSegmentLiquidDepth(tank, liquidDepth, segment, index)) || null;
  }
  function getSegmentActualPerMm(segment){
    const depthSpan = segment.end_depth_mm - segment.start_depth_mm;
    if(depthSpan <= 0) return 0;
    return (segment.end_l - segment.start_l) / depthSpan;
  }
  function getSegmentFormulaPerMm(tank, segment){
    if(usesRecordedPerMmSegmentCalc(tank)) return Number(segment.recorded_per_mm_l);
    return getSegmentActualPerMm(segment);
  }
  function getGaugeMeta(tank, gaugeMm){
    if(isSegmentTank(tank)){
      const liquidDepth = getTankLiquidDepth(tank, gaugeMm);
      const segment = getTankSegmentByLiquidDepth(tank, liquidDepth);
      if(segment){
        const decimals = getTankDisplayDecimals(tank);
        const formulaPerMm = getSegmentFormulaPerMm(tank, segment);
        const displayDigits = usesBoundaryRecalcSegmentCalc(tank) ? 6 : decimals;
        return {
          liquidDepth,
          segment,
          perMmDisplay: Number(formulaPerMm).toFixed(displayDigits),
          twoMmDisplay: Number(formulaPerMm * 2).toFixed(displayDigits),
          segmentRangeLabel: `${segment.start_depth_mm}〜${segment.end_depth_mm}mm（底からの深さ）`,
          formulaLabel: `開始容量 ${segment.start_l}L（${segment.start_depth_mm}mm）＋ ${liquidDepth - segment.start_depth_mm}mm × 1mm当 ${formulaPerMm.toFixed(6)}L`,
          calcMethodLabel: getTankCalcMethodLabel(tank),
          boundaryLabel: getTankBoundaryLabel(tank),
          startLDisplay: `${segment.start_l}L`,
          formulaPerMmDisplay: formulaPerMm.toFixed(6),
          liquidDepthDisplay: `入身深 ${liquidDepth}mm（中心深 ${tank.center_mm}mm − 検尺（空積深） ${gaugeMm}mm）`,
          centerDepthDisplay: `${tank.center_mm}mm`,
          gaugeDisplay: `${gaugeMm}mm`
        };
      }
    }
    const decimals = getTankDisplayDecimals(tank);
    return {
      liquidDepth: getTankLiquidDepth(tank, gaugeMm),
      segment: null,
      perMmDisplay: Number(tank.per_mm_l).toFixed(decimals),
      twoMmDisplay: Number(tank.per_mm_l * 2).toFixed(decimals),
      segmentRangeLabel: '',
      formulaLabel: `底板面以下 ${tank.bottom_l}L ＋ （中心深 ${tank.center_mm}mm − 検尺（空積深） ${gaugeMm}mm）× 1mm当 ${Number(tank.per_mm_l).toFixed(decimals)}L`,
      calcMethodLabel: '固定1mm当たり計算',
      boundaryLabel: '',
      startLDisplay: `${tank.bottom_l}L`,
      formulaPerMmDisplay: Number(tank.per_mm_l).toFixed(decimals),
      liquidDepthDisplay: `入身深 ${getTankLiquidDepth(tank, gaugeMm)}mm（中心深 ${tank.center_mm}mm − 検尺（空積深） ${gaugeMm}mm）`,
      centerDepthDisplay: `${tank.center_mm}mm`,
      gaugeDisplay: `${gaugeMm}mm`
    };
  }
  function calculateReferencePerMm(tank){
    return (tank.full_l - tank.bottom_l) / tank.center_mm;
  }
  function formatApproxStepValue(value, digits=1){
    const num = Number(value);
    if(!Number.isFinite(num)) return '—';
    return num.toFixed(digits).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
  }
  function formatTwoMmPerStepValue(perMmValue){
    const num = Number(perMmValue);
    if(!Number.isFinite(num)) return '—';
    return formatApproxStepValue(num * 2, 1);
  }
  function getBoundaryTwoMmDisplay(tank, liquidDepth){
    if(!isSegmentTank(tank) || !usesNextSegmentBoundaryMode(tank)) return null;
    const segments = tank.segments || [];
    for(let index = 1; index < segments.length; index += 1){
      const prevSegment = segments[index - 1];
      const nextSegment = segments[index];
      if(Number(nextSegment.start_depth_mm) !== Number(liquidDepth)) continue;
      const prevDisplay = formatTwoMmPerStepValue(getSegmentFormulaPerMm(tank, prevSegment));
      const nextDisplay = formatTwoMmPerStepValue(getSegmentFormulaPerMm(tank, nextSegment));
      if(prevDisplay === '—' || nextDisplay === '—' || prevDisplay === nextDisplay) return null;
      const low = Math.min(Number(prevDisplay), Number(nextDisplay));
      const high = Math.max(Number(prevDisplay), Number(nextDisplay));
      return `約${formatApproxStepValue(low,1)}〜${formatApproxStepValue(high,1)}L`;
    }
    return null;
  }
  function buildResultTwoMmText(tank, gaugeMm){
    if(!tank || gaugeMm == null) return '';
    const gaugeMeta = getGaugeMeta(tank, gaugeMm);
    if(!gaugeMeta) return '';
    if(isSegmentTank(tank)){
      const boundaryDisplay = getBoundaryTwoMmDisplay(tank, gaugeMeta.liquidDepth);
      if(boundaryDisplay) return `2mm当 ${boundaryDisplay}
※1mm当切替値`;
    }
    const display = formatTwoMmPerStepValue(gaugeMeta.formulaPerMmDisplay);
    if(display === '—') return '';
    return `2mm当 約${display}L`;
  }
  function syncShareToggle(){
    const open = Boolean(state.shareOpen);
    if(els.shareCard) els.shareCard.classList.toggle('is-open', open);
    if(els.shareBody) els.shareBody.hidden = !open;
    if(els.shareToggle){
      els.shareToggle.textContent = open ? 'メモを閉じる' : 'メモを開く';
      els.shareToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }
  function setShareOpen(open, options={}){
    state.shareOpen = Boolean(open);
    syncShareToggle();
    if(options.save !== false) saveTm2UiState({updateHistory: options.updateHistory !== false});
  }
  function calculateRawVolume(tank, gaugeMm){
    if(isSegmentTank(tank)){
      const liquidDepth = getTankLiquidDepth(tank, gaugeMm);
      const segment = getTankSegmentByLiquidDepth(tank, liquidDepth);
      if(segment){
        return segment.start_l + ((liquidDepth - segment.start_depth_mm) * getSegmentFormulaPerMm(tank, segment));
      }
    }
    return tank.bottom_l + ((tank.center_mm - gaugeMm) * tank.per_mm_l);
  }
  function calculateVolume(tank, gaugeMm){
    const rawVolume = calculateRawVolume(tank, gaugeMm);
    return Math.min(tank.full_l, Math.max(tank.bottom_l, Math.floor(rawVolume)));
  }
  
function buildCandidateFormulaText(tank, gaugeMm, rawVolume, displayedL){
  const liquidDepth = getTankLiquidDepth(tank, gaugeMm);
  if(isSegmentTank(tank)){
    const segment = getTankSegmentByLiquidDepth(tank, liquidDepth);
    if(segment){
      const formulaPerMm = getSegmentFormulaPerMm(tank, segment);
      const diffMm = liquidDepth - segment.start_depth_mm;
      return `中心深 ${tank.center_mm}mm − 検尺（空積深） ${gaugeMm}mm = 入身深 ${liquidDepth}mm。入身深 ${liquidDepth}mm は ${segment.start_depth_mm}〜${segment.end_depth_mm}mm の区間なので、開始容量 ${segment.start_l}L（${segment.start_depth_mm}mm）＋ ${diffMm}mm × 1mm当 ${formulaPerMm.toFixed(6)}L = ${rawVolume.toFixed(5)}L、表示は ${displayedL}Lです。`;
    }
  }
  return `中心深 ${tank.center_mm}mm − 検尺（空積深） ${gaugeMm}mm = 入身深 ${liquidDepth}mm。底板面以下 ${tank.bottom_l}L ＋ ${liquidDepth}mm × 1mm当 ${Number(tank.per_mm_l).toFixed(getTankDisplayDecimals(tank))}L = ${rawVolume.toFixed(5)}L、表示は ${displayedL}Lです。`;
}
function buildAuditInfo(tank){
  if(!tank || tank.audit_enabled === false){
    return { status:'idle', title:'監査状態', summary:'未選択', note:'' };
  }
  if(isSegmentTank(tank)){
    const forceCaution = tank.audit_force_caution === true;
    return {
      status: forceCaution ? 'caution' : 'ok',
      title:'監査状態',
      summary: tank.audit_summary || (forceCaution ? '注意あり' : '区間登録済み'),
      note: forceCaution ? (tank.audit_status_note || '詳細はタンク登録詳細を開くで確認してください。') : ''
    };
  }
  const reference = calculateReferencePerMm(tank);
  const fullDepthDiffL = Math.abs(reference - Number(tank.per_mm_l)) * tank.center_mm;
  const isSignificant = fullDepthDiffL >= 1 || tank.audit_force_caution === true;
  return {
    status: isSignificant ? 'caution' : 'ok',
    title:'監査状態',
    summary: isSignificant ? '注意あり' : '登録値あり',
    note: isSignificant ? (tank.audit_status_note || '記載1mm当と検算値に差があります。') : ''
  };
}
  function buildCombinedDetailGroups(tank, candidate){
    if(!tank) return [];
    const groups = [];
    const calcRows = [];
    if(candidate){
      if(candidate.targetVolume != null) calcRows.push({ label:'入力した数量', value:`${candidate.targetVolume}L` });
      if(candidate.mm != null) calcRows.push({ label:'今回の検尺値', value:`${candidate.mm}mm` });
      if(candidate.liquidDepthDisplay) calcRows.push({ label:'入身深', value:candidate.liquidDepthDisplay });
      if(candidate.segmentRangeLabel) calcRows.push({ label:'使った区間', value:candidate.segmentRangeLabel });
      if(candidate.startLDisplay && candidate.segmentRangeLabel) calcRows.push({ label:'区間の開始容量', value:candidate.startLDisplay });
      if(candidate.formulaPerMmDisplay) calcRows.push({ label:'今回使った1mm当', value:`${candidate.formulaPerMmDisplay}L` });
      calcRows.push({ label:'切り捨て前', value:`${candidate.rawVolume.toFixed(3)}L` });
      calcRows.push({ label:'表示値', value:`${candidate.displayedL}L` });
      if(candidate.formula) calcRows.push({ label:'計算の内訳', value:candidate.formula });
    }else{
      calcRows.push({ label:'表示内容', value:'入力すると、今回の計算内容をここに表示します。' });
    }
    groups.push({ heading:'今回の計算', rows:calcRows });

    const registerRows = [
      { label:'全容量', value:`${tank.full_l}L` },
      { label:'底板面以下', value:`${tank.bottom_l}L` },
      { label:'中心深', value:`${tank.center_mm}mm` },
      { label:'登録方式', value:isSegmentTank(tank) ? '区間別タンク' : '単一区間タンク' }
    ];
    if(!isSegmentTank(tank) && Number.isFinite(Number(tank.per_mm_l))){
      registerRows.push({ label:'記載1mm当', value:`${Number(tank.per_mm_l).toFixed(countDecimals(tank.per_mm_l))}L` });
    }
    if(tank.source_note) registerRows.push({ label:'元資料', value:tank.source_note });
    groups.push({ heading:'タンク登録値', rows:registerRows });


    const supplementRows = [];
    if(tank.audit_force_caution === true && tank.audit_note){
      supplementRows.push({ label:'注意の根拠', value:tank.audit_note });
    }
    if(supplementRows.length > 0){
      groups.push({ heading:'補足', rows:supplementRows });
    }
    return groups;
  }
  function renderAuditGrid(tank, candidate){
    const detailGroups = buildCombinedDetailGroups(tank, candidate);
    if(detailGroups.length===0){
      els.auditGrid.innerHTML = '<div class="tm2-detail-row"><span>詳細</span><div class="tm2-detail-value">表示できる情報がありません。</div></div>';
      return;
    }
    els.auditGrid.innerHTML = detailGroups.map(group => {
      const headingRow = group.heading ? `<div class="tm2-detail-heading">${group.heading}</div>` : '';
      const rows = Array.isArray(group.rows) ? group.rows.map(row => {
        const rowClass = row.className ? `tm2-detail-row ${row.className}` : 'tm2-detail-row';
        return `<div class="${rowClass}"><span>${row.label}</span><div class="tm2-detail-value">${row.value}</div></div>`;
      }).join('') : '';
      return `<div class="tm2-detail-group">${headingRow}${rows}</div>`;
    }).join('');
  }
  function renderReasonGrid(candidates){
    if(!candidates || candidates.length===0){
      els.reasonGrid.innerHTML = '<div class="tm2-detail-row"><span>候補</span><div class="tm2-detail-value">表示できる近隣候補がありません。</div></div>';
      return;
    }
    const firstTargetVolume = candidates.find(candidate => candidate && candidate.targetVolume != null);
    const targetGroup = firstTargetVolume ? `<div class="tm2-detail-group"><div class="tm2-detail-row"><span>入力した数量</span><div class="tm2-detail-value">${firstTargetVolume.targetVolume}L</div></div></div>` : '';
    const candidateGroups = candidates.map(candidate => {
      const headingRow = candidate.heading ? `<div class="tm2-detail-heading">${candidate.heading}</div>` : '';
      const mmRow = candidate.mm != null ? `<div class="tm2-detail-row"><span>検尺（空積深）</span><div class="tm2-detail-value">${candidate.mm}mm</div></div>` : '';
      const displayedRow = candidate.displayedL != null ? `<div class="tm2-detail-row"><span>表示値</span><div class="tm2-detail-value">${candidate.displayedL}L</div></div>` : '';
      return `<div class="tm2-detail-group">${headingRow}${mmRow}${displayedRow}</div>`;
    }).join('');
    els.reasonGrid.innerHTML = targetGroup + candidateGroups;
  }
  function syncReasonToggle(){
    const enabled = Boolean(getSelectedTank()) && Number.isFinite(Number(state.lastValidGauge));
    setPseudoDisabled(els.reasonToggle, !enabled);
    els.reasonToggle.textContent = 'この位置を2mm表一覧で見る';
    els.reasonToggle.removeAttribute('aria-expanded');
    els.reasonPanel.hidden = true;
  }
  function syncAuditToggle(tank){
    const enabled = Boolean(tank);
    setPseudoDisabled(els.auditToggle, !enabled);
    els.auditToggle.textContent = enabled ? (state.auditOpen ? '登録値と換算内訳を閉じる' : '登録値と換算内訳を見る') : '登録値と換算内訳を見る';
    els.auditToggle.setAttribute('aria-expanded', state.auditOpen ? 'true' : 'false');
    els.auditPanel.hidden = !(enabled && state.auditOpen);
  }

  function updateCurrentTankCard(tank){
    if(!tank){
      els.currentCard.classList.add('is-empty');
      els.currentName.textContent = '未選択';
      els.currentMeta.hidden = true;
      els.currentRange.textContent = '—';
      els.currentVolumeRange.textContent = '—';
      els.currentNote.textContent = '先にタンクを選ぶと、この下で見る内容を選べます。';
      return;
    }
    els.currentCard.classList.remove('is-empty');
    els.currentName.textContent = tank.label;
    els.currentMeta.hidden = false;
    els.currentRange.textContent = `0〜${tank.center_mm}mm の偶数`;
    els.currentVolumeRange.textContent = `${tank.bottom_l}〜${tank.full_l}L`;
    if(isSegmentTank(tank) && usesBoundaryRecalcSegmentCalc(tank)){
      els.currentNote.textContent = `${tank.label} は区間の始点Lと終点Lから1mm当を再計算する方式です。`;
      return;
    }
    if(isSegmentTank(tank) && usesRecordedPerMmSegmentCalc(tank)){
      els.currentNote.textContent = `${tank.label} は区間の記載1mm当をそのまま使う方式です。`;
      return;
    }
    els.currentNote.textContent = isSegmentTank(tank) ? 'このタンクは、区間ごとに1mm当が変わる前提で計算します。下で尺から見るかLから見るかを選びます。' : 'このタンクを基準に、下で尺から見るかLから見るかを選びます。';
  }
  function syncModeButtons(tank){
    const enabled = Boolean(tank);
    els.modeButtons.forEach(btn => {
      btn.disabled = !enabled;
    });
  }
  function setError(message, kind){
    els.errorBox.hidden = !message;
    els.errorBox.textContent = message || '';
    els.errorBox.classList.toggle('is-guide', kind === 'guide' && Boolean(message));
  }
  function setResultSubtext(message, kind){
    els.resultSubtext.textContent = message || '';
    els.resultSubtext.classList.toggle('is-guide', kind === 'guide' && Boolean(message));
  }
  function formatTm2RawVolume(value){
    const num = Number(value);
    if(!Number.isFinite(num)) return '';
    return num.toFixed(3);
  }
  function buildTm2RoundedBeforeText(rawVolume){
    const display = formatTm2RawVolume(rawVolume);
    if(!display) return '';
    return `切り捨て前：${display}L`;
  }
  function composeResultSubtext(twoMmText, extraNotes=[]){
    const parts = [];
    extraNotes.filter(Boolean).forEach(note => parts.push(note));
    if(twoMmText) parts.push(twoMmText);
    return parts.join('\n');
  }
  function updateAuditView(tank){
    if(!tank){
      els.auditStatus.className = 'tm2-status is-idle';
      els.auditStatus.innerHTML = '<div class="tm2-status-row"><span class="tm2-status-badge">監査状態</span><div class="tm2-status-title">タンク未選択</div></div>';
      els.auditGrid.innerHTML = '';
      state.auditOpen = false;
      syncAuditToggle(null);
      return;
    }
    const audit = buildAuditInfo(tank);
    els.auditStatus.className = `tm2-status ${audit.status === 'caution' ? 'is-caution' : 'is-ok'}`;
    els.auditStatus.innerHTML = `<div class="tm2-status-row"><span class="tm2-status-badge">${audit.title}</span><div class="tm2-status-title">${audit.summary || ''}</div></div>${audit.note ? `<div class="tm2-status-note">${audit.note}</div>` : ''}`;
    renderAuditGrid(tank, state.lastCalcDetail);
    syncAuditToggle(tank);
  }
  function updateInputAvailability(){
    const tank = getSelectedTank();
    const hasTank = Boolean(tank);
    syncModeButtons(tank);
    updateCurrentTankCard(tank);
    els.gaugeInput.disabled = !hasTank || state.mode !== 'gauge';
    els.volumeInput.disabled = !hasTank || state.mode !== 'volume';
    syncDocsLink(tank);
    if(tank){
      els.gaugeHelp.textContent = `入力範囲: 0〜${tank.center_mm}mm の偶数`;
      els.volumeHelp.textContent = `入力目安: ${tank.bottom_l}〜${tank.full_l}L`;
    }else{
      els.gaugeHelp.textContent = 'タンクを選ぶと入力できる範囲の目安を表示します。';
      els.volumeHelp.textContent = 'タンクを選ぶと入力できる範囲の目安を表示します。';
    }
  }
  function validateGaugeInput(rawValue, tank){
    const value = String(rawValue).trim();
    if(!tank) return { valid:false, message:'先にタンク番号を選んでください。' };
    if(value==='') return { valid:false, message:'' };
    if(!/^\d+$/.test(value)) return { valid:false, message:'この検尺値には値がありません。0〜中心深mm の偶数を入力してください。' };
    const gaugeMm = Number(value);
    if(gaugeMm < 0 || gaugeMm > tank.center_mm || gaugeMm % 2 !== 0) return { valid:false, message:'この検尺値には値がありません。0〜中心深mm の偶数を入力してください。' };
    return { valid:true, gaugeMm };
  }
  function validateVolumeInput(rawValue, tank){
    const value = String(rawValue).trim();
    if(!tank) return { valid:false, message:'先にタンク番号を選んでください。' };
    if(value==='') return { valid:false, message:'' };
    if(!/^\d+(?:\.\d+)?$/.test(value)) return { valid:false, message:`この数量には候補がありません。${tank.bottom_l}〜${tank.full_l}L を入力してください。` };
    const targetVolume = Number(value);
    if(!Number.isFinite(targetVolume) || targetVolume < tank.bottom_l || targetVolume > tank.full_l) return { valid:false, message:`この数量には候補がありません。${tank.bottom_l}〜${tank.full_l}L を入力してください。` };
    return { valid:true, targetVolume };
  }
  function hasExactDisplayedVolumeCandidate(tank, targetVolume){
    if(!Number.isInteger(targetVolume)) return false;
    for(let mm=0; mm<=tank.center_mm; mm+=2){
      if(calculateVolume(tank, mm) === targetVolume) return true;
    }
    return false;
  }
  function buildVolumeCandidates(tank, targetVolume){
    const allCandidates = [];
    for(let mm=0; mm<=tank.center_mm; mm+=2){
      const rawVolume = calculateRawVolume(tank, mm);
      const displayedL = calculateVolume(tank, mm);
      const gaugeMeta = getGaugeMeta(tank, mm);
      const formula = buildCandidateFormulaText(tank, mm, rawVolume, displayedL);
      allCandidates.push({
        heading:`候補 ${mm}mm`, targetVolume, mm, rawVolume, displayedL,
        diffAbs:Math.abs(rawVolume - targetVolume), perMmDisplay:gaugeMeta.perMmDisplay, twoMmDisplay: gaugeMeta.twoMmDisplay,
        segmentRangeLabel:gaugeMeta.segmentRangeLabel,
        calcMethodLabel:gaugeMeta.calcMethodLabel,
        boundaryLabel:gaugeMeta.boundaryLabel,
        startLDisplay:gaugeMeta.startLDisplay,
        formulaPerMmDisplay:gaugeMeta.formulaPerMmDisplay,
        liquidDepthDisplay:gaugeMeta.liquidDepthDisplay,
        centerDepthDisplay:gaugeMeta.centerDepthDisplay,
        formula
      });
    }
    allCandidates.sort((a,b) => a.diffAbs !== b.diffAbs ? a.diffAbs - b.diffAbs : a.mm - b.mm);
    const targetDisplayedL = Math.floor(targetVolume);
    const exactDisplayed = allCandidates.filter(candidate => candidate.displayedL === targetDisplayedL);
    const hasExactDisplayedMatch = exactDisplayed.length > 0;
    let primaryCandidates = [];
    if(exactDisplayed.length > 0){
      exactDisplayed.sort((a,b) => a.diffAbs !== b.diffAbs ? a.diffAbs - b.diffAbs : a.mm - b.mm);
      primaryCandidates = [exactDisplayed[0]];
    }else{
      const minDiff = allCandidates[0] ? allCandidates[0].diffAbs : null;
      if(minDiff == null) return [];
      primaryCandidates = allCandidates.filter(candidate => Math.abs(candidate.diffAbs - minDiff) < 1e-9);
    }
    const mmMap = new Map(allCandidates.map(candidate => [candidate.mm, candidate]));
    const used = new Set();
    const displayCandidates = [];
    const primaryCount = primaryCandidates.length;
    primaryCandidates.forEach((candidate, index) => {
      const heading = primaryCount === 1 ? `目安 ${candidate.mm}mm` : `候補 ${index + 1} ${candidate.mm}mm`;
      displayCandidates.push({ ...candidate, heading, isPrimary:true, includeInNearby: !hasExactDisplayedMatch });
      used.add(candidate.mm);
    });
    const minPrimaryMm = Math.min(...primaryCandidates.map(candidate => candidate.mm));
    const maxPrimaryMm = Math.max(...primaryCandidates.map(candidate => candidate.mm));
    const lowerCandidate = mmMap.get(minPrimaryMm - 2);
    const upperCandidate = mmMap.get(maxPrimaryMm + 2);
    if(lowerCandidate && !used.has(lowerCandidate.mm)){
      displayCandidates.push({ ...lowerCandidate, heading:`ひとつ下 ${lowerCandidate.mm}mm`, isNearby:true, includeInNearby:true, neighborSide:'lower' });
      used.add(lowerCandidate.mm);
    }
    if(upperCandidate && !used.has(upperCandidate.mm)){
      displayCandidates.push({ ...upperCandidate, heading:`ひとつ上 ${upperCandidate.mm}mm`, isNearby:true, includeInNearby:true, neighborSide:'upper' });
      used.add(upperCandidate.mm);
    }
    return displayCandidates;
  }
  function updateResult(){
    const tank = getSelectedTank();
    updateAuditView(tank);
    state.lastReasonCandidates = [];
    state.lastCalcDetail = null;
    state.reasonOpen = false;
    renderReasonGrid([]);
    syncReasonToggle();
    if(!tank){
      els.resultValue.textContent = '—';
      setResultSubtext('', '');
      setPseudoDisabled(els.openListBtn, true);
      setError('');
      state.lastValidGauge = null;
      state.scrollTargetGauge = null;
      state.lastCalcDetail = null;
      renderAuditGrid(tank, state.lastCalcDetail);
      syncReasonToggle();
      return;
    }
    setPseudoDisabled(els.openListBtn, false);
    if(state.mode === 'gauge'){
      const validation = validateGaugeInput(els.gaugeInput.value, tank);
      if(String(els.gaugeInput.value).trim()===''){
        els.resultValue.textContent = '—';
        setResultSubtext('', '');
        setError('');
        state.lastValidGauge = null;
        state.scrollTargetGauge = null;
        state.lastCalcDetail = null;
        renderAuditGrid(tank, state.lastCalcDetail);
        syncReasonToggle();
        return;
      }
      if(!validation.valid){
        els.resultValue.textContent = '—';
        setResultSubtext('', '');
        state.lastValidGauge = null;
        state.scrollTargetGauge = null;
        state.lastCalcDetail = null;
        renderAuditGrid(tank, state.lastCalcDetail);
        setError(validation.message);
        syncReasonToggle();
        return;
      }
      const volume = calculateVolume(tank, validation.gaugeMm);
      const rawVolume = calculateRawVolume(tank, validation.gaugeMm);
      const gaugeMeta = getGaugeMeta(tank, validation.gaugeMm);
      state.lastCalcDetail = {
        heading:'', mm:validation.gaugeMm, rawVolume, displayedL:volume, perMmDisplay:gaugeMeta.perMmDisplay, twoMmDisplay:gaugeMeta.twoMmDisplay,
        segmentRangeLabel:gaugeMeta.segmentRangeLabel,
        calcMethodLabel:gaugeMeta.calcMethodLabel,
        boundaryLabel:gaugeMeta.boundaryLabel,
        startLDisplay:gaugeMeta.startLDisplay,
        formulaPerMmDisplay:gaugeMeta.formulaPerMmDisplay,
        liquidDepthDisplay:gaugeMeta.liquidDepthDisplay,
        centerDepthDisplay:gaugeMeta.centerDepthDisplay,
        formula:buildCandidateFormulaText(tank, validation.gaugeMm, rawVolume, volume)
      };
      state.lastReasonCandidates = [validation.gaugeMm - 2, validation.gaugeMm + 2]
        .filter(mm => mm >= 0 && mm <= tank.center_mm)
        .map(mm => ({
          heading: mm < validation.gaugeMm ? `ひとつ下 ${mm}mm` : `ひとつ上 ${mm}mm`,
          mm,
          displayedL: calculateVolume(tank, mm)
        }));
      els.resultValue.textContent = `${volume} L`;
      state.lastValidGauge = validation.gaugeMm;
      state.scrollTargetGauge = validation.gaugeMm;
      renderReasonGrid(state.lastReasonCandidates);
      renderAuditGrid(tank, state.lastCalcDetail);
      syncReasonToggle();
      setResultSubtext(composeResultSubtext(buildResultTwoMmText(tank, validation.gaugeMm), [buildTm2RoundedBeforeText(rawVolume)]), '');
      setError('');
      return;
    }
    const validation = validateVolumeInput(els.volumeInput.value, tank);
    if(String(els.volumeInput.value).trim()===''){
      els.resultValue.textContent = '—';
      setResultSubtext('', '');
      setError('');
      state.lastValidGauge = null;
      state.scrollTargetGauge = null;
      state.lastCalcDetail = null;
      renderAuditGrid(tank, state.lastCalcDetail);
      syncReasonToggle();
      return;
    }
    if(!validation.valid){
      els.resultValue.textContent = '—';
      setResultSubtext('', '');
      state.lastValidGauge = null;
      state.scrollTargetGauge = null;
      state.lastCalcDetail = null;
      renderAuditGrid(tank, state.lastCalcDetail);
      setError(validation.message);
      syncReasonToggle();
      return;
    }
    const candidates = buildVolumeCandidates(tank, validation.targetVolume);
    if(!candidates.length){
      els.resultValue.textContent = '—';
      setResultSubtext('', '');
      state.lastValidGauge = null;
      state.scrollTargetGauge = null;
      state.lastCalcDetail = null;
      renderAuditGrid(tank, state.lastCalcDetail);
      setError('この数量には候補がありません。');
      syncReasonToggle();
      return;
    }
    const primaryCandidates = candidates.filter(candidate => candidate.isPrimary === true);
    state.lastCalcDetail = primaryCandidates[0] || null;
    state.lastReasonCandidates = candidates.filter(candidate => candidate.includeInNearby === true);
    if(!primaryCandidates.length){
      els.resultValue.textContent = '—';
      setResultSubtext('', '');
      state.lastValidGauge = null;
      state.scrollTargetGauge = null;
      state.lastCalcDetail = null;
      renderAuditGrid(tank, state.lastCalcDetail);
      setError('この数量には候補がありません。');
      syncReasonToggle();
      return;
    }
    state.lastValidGauge = primaryCandidates[0].mm;
    state.scrollTargetGauge = primaryCandidates[0].mm;
    els.resultValue.textContent = primaryCandidates.map(candidate => `${candidate.mm}mm`).join(' / ');
    const notes = [];
    if(Number.isInteger(validation.targetVolume) && !hasExactDisplayedVolumeCandidate(tank, validation.targetVolume)) notes.push('入力した数量に一致する表示Lがないため、近い候補を目安として表示しています。');
    if(primaryCandidates.length > 1) notes.push('表示Lが同じ候補が複数あるため、並べて表示しています。');
    renderReasonGrid(state.lastReasonCandidates);
    renderAuditGrid(tank, state.lastCalcDetail);
    syncReasonToggle();
    const twoMmText = primaryCandidates.length === 1 ? buildResultTwoMmText(tank, primaryCandidates[0].mm) : '';
    setResultSubtext(composeResultSubtext(twoMmText, notes), notes.length ? 'guide' : '');
    setError('');
  }
  function populateGroups(){
    getGroups().forEach(group => {
      const option = document.createElement('option');
      option.value = group;
      option.textContent = getTankGroupOptionLabel(group);
      els.groupSelect.appendChild(option);
    });
  }
  function populateTanks(groupLabel){
    const tanks = getTanksByGroup(groupLabel);
    els.tankSelect.innerHTML = '';
    if(!groupLabel || tanks.length === 0){
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '該当タンクがありません';
      els.tankSelect.appendChild(option);
      els.tankSelect.disabled = true;
      return;
    }
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'タンク番号を選んでください';
    els.tankSelect.appendChild(defaultOption);
    tanks.forEach(tank => {
      const option = document.createElement('option');
      option.value = String(tank.tank_no);
      option.textContent = getTankSelectOptionLabel(tank);
      els.tankSelect.appendChild(option);
    });
    els.tankSelect.disabled = false;
  }
  function setMode(mode, options={}){
    state.mode = normalizeTm2Mode(mode);
    state.reasonOpen = false;
    state.lastReasonCandidates = [];
    state.lastCalcDetail = null;
    els.modeButtons.forEach(btn => {
      const active = btn.dataset.tm2Mode === state.mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    els.gaugeField.hidden = state.mode !== 'gauge';
    els.volumeField.hidden = state.mode !== 'volume';
    els.resultHeading.textContent = state.mode === 'gauge' ? '換算値(L)' : '候補(mm)';
    updateInputAvailability();
    updateResult();
    if(options.save !== false) saveTm2UiState();
  }
  function resetInputs(){
    els.gaugeInput.value = '';
    els.volumeInput.value = '';
    state.lastValidGauge = null;
    state.scrollTargetGauge = null;
    state.reasonOpen = false;
    state.lastReasonCandidates = [];
    state.lastCalcDetail = null;
    els.resultValue.textContent = '—';
    setResultSubtext('', '');
    renderReasonGrid([]);
    syncReasonToggle();
    setError('');
    updateAuditView(getSelectedTank());
    saveTm2UiState();
  }
  function getTm2ListScrollGauge(){
    if(Number.isFinite(state.scrollTargetGauge)) return Number(state.scrollTargetGauge);
    if(Number.isFinite(state.lastValidGauge)) return Number(state.lastValidGauge);
    const datasetValue = Number(els.listPanel?.dataset?.tm2ScrollGauge || '');
    return Number.isFinite(datasetValue) ? datasetValue : null;
  }
  function getTm2ListHighlightRow(){
    const gauge = getTm2ListScrollGauge();
    if(Number.isFinite(gauge)){
      const exactRow = els.listBody.querySelector(`[data-tm2-mm="${gauge}"]`);
      if(exactRow) return exactRow;
    }
    return els.listBody.querySelector('[data-tm2-highlight="1"]');
  }
  function scrollTm2ListToHighlight(attempt=0){
    const tableWrap = els.listPanel?.querySelector('.tm2-table-wrap');
    const highlightRow = getTm2ListHighlightRow();
    const listVisible = Boolean(els.listPanel && !els.listPanel.hidden && els.mainPanel && els.mainPanel.hidden);
    const screenActive = isTm2ScreenActive();
    if(!tableWrap || !listVisible || !screenActive || tableWrap.clientHeight <= 0 || tableWrap.scrollHeight <= 0){
      if(attempt < 24){
        requestAnimationFrame(() => scrollTm2ListToHighlight(attempt + 1));
      }
      return;
    }
    if(!highlightRow){
      tableWrap.scrollTop = 0;
      return;
    }
    const tableIsScrollable = tableWrap.scrollHeight > tableWrap.clientHeight + 2;
    if(!tableIsScrollable){
      try{
        highlightRow.scrollIntoView({block:'center', inline:'nearest'});
      }catch{
        highlightRow.scrollIntoView();
      }
      if(attempt === 0){
        setTimeout(() => scrollTm2ListToHighlight(25), 120);
      }
      return;
    }
    const wrapRect = tableWrap.getBoundingClientRect();
    const rowRect = highlightRow.getBoundingClientRect();
    const head = tableWrap.querySelector('thead');
    const headerHeight = head ? head.getBoundingClientRect().height : 0;
    const currentTop = tableWrap.scrollTop;
    const rowTopWithinWrap = (rowRect.top - wrapRect.top) + currentTop;
    const targetTop = Math.max(0, rowTopWithinWrap - ((tableWrap.clientHeight - rowRect.height) / 2) - (headerHeight / 2));
    tableWrap.scrollTop = targetTop;
    if(attempt < 24 && Math.abs(tableWrap.scrollTop - targetTop) > 2){
      requestAnimationFrame(() => scrollTm2ListToHighlight(attempt + 1));
      return;
    }
    if(attempt === 0){
      setTimeout(() => scrollTm2ListToHighlight(25), 120);
    }
  }
  function syncListSearchHelp(){
    const open = Boolean(state.listSearchHelpOpen);
    if(els.listSearchHelpBody) els.listSearchHelpBody.hidden = !open;
    if(els.listSearchHelpToggle){
      els.listSearchHelpToggle.textContent = open ? '一覧内の探し方を閉じる' : '一覧内の探し方を見る';
      els.listSearchHelpToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }
  function getTm2ListPositionSummary(tank, scrollGauge){
    if(!tank || !Number.isFinite(scrollGauge)) return '';
    const volume = calculateVolume(tank, scrollGauge);
    const rawVolume = calculateRawVolume(tank, scrollGauge);
    const parts = [`前の画面で見ていた位置：${scrollGauge}mm / ${volume}L`];
    const twoMmText = buildResultTwoMmText(tank, scrollGauge);
    if(twoMmText) parts.push(twoMmText);
    const rawText = buildTm2RoundedBeforeText(rawVolume);
    if(rawText) parts.push(rawText);
    return parts.join('　');
  }
  function getListPositionMissingGuide(){
    const tank = getSelectedTank();
    if(!tank) return '未入力があります。先にタンクを選択してください。';
    if(state.mode === 'gauge' && String(els.gaugeInput.value || '').trim() === '') return '未入力があります。検尺値mmを入力してください。';
    if(state.mode === 'volume' && String(els.volumeInput.value || '').trim() === '') return '未入力があります。目標数量Lを入力してください。';
    if(!Number.isFinite(Number(state.lastValidGauge))) return '入力値を確認してください。2mm表一覧で見る位置がまだ決まっていません。';
    return '';
  }
  function openList(options={}){
    const tank = getSelectedTank();
    if(!tank){ tm2GuideToast('未入力があります。先にタンクを選択してください。'); return; }
    const scrollGauge = getTm2ListScrollGauge();
    els.listTitle.textContent = `${tank.label} のタンク別2mm表一覧`; 
    if(els.listNearby){
      const summary = getTm2ListPositionSummary(tank, scrollGauge);
      els.listNearby.hidden = !summary;
      els.listNearby.textContent = summary;
    }
    syncListSearchHelp();
    els.listPanel.dataset.tm2ScrollGauge = Number.isFinite(scrollGauge) ? String(scrollGauge) : '';
    const rows = [];
    for(let mm=0; mm<=tank.center_mm; mm+=2){
      const volume = calculateVolume(tank, mm);
      const highlight = Number.isFinite(scrollGauge) && scrollGauge === mm;
      rows.push(`<tr data-tm2-mm="${mm}"${highlight ? ' class="is-highlight" data-tm2-highlight="1"' : ''}><td>${mm}</td><td>${volume}</td></tr>`);
    }
    els.listBody.innerHTML = rows.join('');
    els.mainPanel.hidden = true;
    els.listPanel.hidden = false;
    if(options.pushHistory === true && typeof window.pushCurrentBrowserHistoryState === 'function'){
      try{ window.pushCurrentBrowserHistoryState({force:true}); }catch{}
    }
    if(options.save !== false) saveTm2UiState();
    if(options.scheduleScroll !== false){
      requestAnimationFrame(() => {
        scrollTm2ListToHighlight();
        setTimeout(() => scrollTm2ListToHighlight(25), 160);
      });
    }
  }
  function closeList(options={}){
    state.listSearchHelpOpen = false;
    syncListSearchHelp();
    els.listPanel.hidden = true;
    els.mainPanel.hidden = false;
    delete els.listPanel.dataset.tm2ScrollGauge;
    if(options.save !== false) saveTm2UiState();
  }
  function prepareTank2mmForIncomingShare(options={}){
    const tank = getSelectedTank();
    state.reasonOpen = false;
    state.lastReasonCandidates = [];
    state.lastCalcDetail = null;
    renderReasonGrid([]);
    syncReasonToggle();
    state.auditOpen = false;
    syncAuditToggle(tank);
    if(els.auditPanel) els.auditPanel.hidden = true;
    if(els.listPanel && !els.listPanel.hidden) closeList({save:false});
    else if(els.mainPanel) els.mainPanel.hidden = false;
    if(options.openShare !== false) setShareOpen(true, {save:false, updateHistory:false});
    else setShareOpen(false, {save:false, updateHistory:false});
    if(options.clearReturn !== false) clearTm2ReturnState();
    try{ syncDocsLink(tank); }catch{}
    if(options.save !== false) saveTm2UiState({updateHistory: options.updateHistory !== false});
  }
  function restoreTm2ShareMemo(){
    if(!els.shareMemoInput) return;
    const stored = tm2StorageGet(TM2_SHARE_MEMO_KEY);
    if(stored != null) els.shareMemoInput.value = stored;
  }
  function saveTm2ShareMemo(){
    if(!els.shareMemoInput) return;
    tm2StorageSet(TM2_SHARE_MEMO_KEY, els.shareMemoInput.value || '');
  }
  function clearTm2ShareMemo(){
    if(!els.shareMemoInput) return;
    els.shareMemoInput.value = '';
    tm2StorageRemove(TM2_SHARE_MEMO_KEY);
    tm2Toast('メモを消しました');
  }
  if(els.docsLinkBtn){
    els.docsLinkBtn.addEventListener('click', event => {
      const tank = getSelectedTank();
      if(!tank || els.docsLinkBtn.classList.contains('is-disabled')){
        event.preventDefault();
        tm2GuideToast('未入力があります。先にタンクを選択してください。');
        return;
      }
      saveTm2UiState();
      saveTm2ReturnState();
      try{ saveUIState(); }catch{}
    });
  }
  root.addEventListener('click', event => {
    const anyActionBtn = event.target.closest('[data-action]');
    if(anyActionBtn && anyActionBtn.dataset.action === 'clear-tm2-share-memo'){
      clearTm2ShareMemo();
      return;
    }
    const btn = event.target.closest('[data-tm2-action]');
    if(!btn) return;
    const action = btn.dataset.tm2Action;
    if(action === 'mode') setMode(btn.dataset.tm2Mode || 'gauge');
    if(action === 'reset') resetInputs();
    if(action === 'open-list') openList({pushHistory:true});
    if(action === 'open-list-position'){
      const missingGuide = getListPositionMissingGuide();
      if(missingGuide){ tm2GuideToast(missingGuide); return; }
      openList({pushHistory:true});
    }
    if(action === 'close-list') closeList();
    if(action === 'open-docs') openTankDocs();
    if(action === 'toggle-share') setShareOpen(!state.shareOpen);
    if(action === 'clear-v2-draft') clearIncomingV2Draft(true);
    if(action === 'apply-v2-draft-candidate') applyIncomingV2DraftCandidate(btn.dataset.tm2V2Index || '');
    if(action === 'toggle-list-search-help'){
      state.listSearchHelpOpen = !state.listSearchHelpOpen;
      syncListSearchHelp();
    }
    if(action === 'toggle-reason'){
      if(state.lastReasonCandidates.length === 0) return;
      state.reasonOpen = !state.reasonOpen;
      renderReasonGrid(state.lastReasonCandidates);
      syncReasonToggle();
      saveTm2UiState();
    }
    if(action === 'toggle-audit'){
      const tank = getSelectedTank();
      if(!tank){ tm2GuideToast('未入力があります。先にタンクを選択してください。'); return; }
      state.auditOpen = !state.auditOpen;
      renderAuditGrid(tank, state.lastCalcDetail);
      syncAuditToggle(tank);
      saveTm2UiState();
    }
  });
  els.groupSelect.addEventListener('change', () => {
    state.selectedGroup = els.groupSelect.value;
    state.selectedTankNo = '';
    state.auditOpen = false;
    state.reasonOpen = false;
    state.lastReasonCandidates = [];
    state.lastCalcDetail = null;
    populateTanks(state.selectedGroup);
    els.tankSelect.value = '';
    els.gaugeInput.value = '';
    els.volumeInput.value = '';
    state.lastValidGauge = null;
    state.scrollTargetGauge = null;
    updateInputAvailability();
    updateResult();
    saveTm2UiState();
  });
  els.tankSelect.addEventListener('change', () => {
    state.selectedTankNo = els.tankSelect.value;
    state.auditOpen = false;
    state.reasonOpen = false;
    state.lastReasonCandidates = [];
    state.lastCalcDetail = null;
    state.lastValidGauge = null;
    state.scrollTargetGauge = null;
    els.gaugeInput.value = '';
    els.volumeInput.value = '';
    updateInputAvailability();
    updateResult();
    saveTm2UiState();
  });
  function refreshTank2mmScreen(){
    renderIncomingV2Draft();
    updateInputAvailability();
    updateResult();
    if(els.listPanel && !els.listPanel.hidden && els.mainPanel && els.mainPanel.hidden){
      openList({save:false});
      return;
    }
    if(isTm2ScreenActive()){
      requestAnimationFrame(() => scrollTm2ListToHighlight());
    }
  }
  window.captureTank2mmState = function(overrides={}){
    return buildTm2UiStateFromCurrent(overrides);
  };
  window.resetTank2mmUiState = function(options={}){
    resetTm2UiState(options);
  };
  window.resolveTank2mmState = function(options={}){
    return resolveTm2UiState(options);
  };
  window.restoreTank2mmState = function(rawState, options={}){
    if(rawState) return applyTm2UiState(rawState, options);
    return restoreTm2UiState(options);
  };
  window.setTank2mmShareMemoOpen = function(open, options={}){
    setShareOpen(open, options);
  };
  window.prepareTank2mmForIncomingShare = function(options={}){
    prepareTank2mmForIncomingShare(options);
  };
  window.receiveTank2mmV2DraftPreview = function(rawDraft, options={}){
    return receiveIncomingV2Draft(rawDraft, options);
  };
  window.clearTank2mmV2DraftPreview = function(notify){
    clearIncomingV2Draft(!!notify);
  };
  window.saveTank2mmUiState = function(options={}){
    return saveTm2UiState(options);
  };
  window.refreshTank2mmScreen = refreshTank2mmScreen;
  window.TM2_BOTTLING_SHARED = {
    getGroups,
    getTanksByGroup,
    getTankGroupOptionLabel,
    getTankSelectOptionLabel,
    getTankByNo: (tankNo) => TM2_TANKS.find(tank => tank.tank_no === Number(tankNo)) || null,
    validateGaugeInput,
    calculateVolume,
    calculateRawVolume
  };
  window.getGroups = getGroups;
  window.getTanksByGroup = getTanksByGroup;
  window.getTankGroupOptionLabel = getTankGroupOptionLabel;
  window.getTankSelectOptionLabel = getTankSelectOptionLabel;
  window.TM2_TANKS = TM2_TANKS;
  window.validateGaugeInput = validateGaugeInput;
  window.calculateVolume = calculateVolume;
  window.calculateRawVolume = calculateRawVolume;
  if(els.shareMemoInput) els.shareMemoInput.addEventListener('input', saveTm2ShareMemo);
  els.gaugeInput.addEventListener('input', () => { updateResult(); saveTm2UiState(); });
  els.volumeInput.addEventListener('input', () => { updateResult(); saveTm2UiState(); });
  restoreTm2ShareMemo();
  populateGroups();
  try{
    const rawSessionDraft = tm2SessionGet(TM2_CANDIDATE_KEY);
    incomingV2Draft = rawSessionDraft ? normalizeIncomingV2Draft(JSON.parse(rawSessionDraft)) : incomingV2Draft;
  }catch{}
  renderIncomingV2Draft();
  updateInputAvailability();
  updateAuditView(null);
  renderReasonGrid([]);
  syncReasonToggle();
  syncShareToggle();
  closeList({save:false});
  restoreTm2UiState({save:false, updateHistory:false});
})();