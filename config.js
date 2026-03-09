window.EDITOR_CONFIG = {
  defaultWrm: 0x1316,
  nesSramBase: 0x6000,
  nesSramEnd: 0x7fff,
  fields: [
    {
      id: "gold",
      labelEn: "GOLD",
      labelZh: "金錢",
      nesAddrs: [0x7f2c, 0x7f2d],
      bytes: 2,
      max: 65535,
      rangeHint: "0 - 65535",
    },
    {
      id: "revive",
      labelEn: "REVIVE GRASS",
      labelZh: "復活草",
      nesAddrs: [0x7f36],
      bytes: 1,
      max: 255,
      rangeHint: "0 - 255",
    },
    {
      id: "troops100",
      labelEn: "TROOPS100",
      labelZh: "兵力100",
      nesAddrs: [0x7f38],
      bytes: 1,
      max: 255,
      rangeHint: "0 - 255",
    },
  ],
};
