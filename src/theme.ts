import { createTheme } from "@mui/material/styles";

export const nochePalette = {
  noche: "#1E1846",
  noche2: "#2A2260",
  noche3: "#3A3180",
  lila: "#C9C3F5",
  pagina: "#EEEBFF",
  tinta: "#1E1846",
  oro: "#F2B33D",
  oroOscuro: "#B5801C",
  coral: "#FF5E7E",
  coralOscuro: "#B83A57",
  peligro: "#C2183F",
};

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: nochePalette.coral, dark: nochePalette.coralOscuro },
    secondary: { main: nochePalette.oro, dark: nochePalette.oroOscuro },
    error: { main: nochePalette.peligro },
    background: { default: nochePalette.noche, paper: nochePalette.pagina },
    text: { primary: "#ffffff", secondary: nochePalette.lila },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ['"Bricolage Grotesque"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"].join(","),
    button: { textTransform: "none", fontWeight: 800 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--noche": nochePalette.noche,
          "--noche-2": nochePalette.noche2,
          "--noche-3": nochePalette.noche3,
          "--lila": nochePalette.lila,
          "--pagina": nochePalette.pagina,
          "--tinta": nochePalette.tinta,
          "--oro": nochePalette.oro,
          "--oro-osc": nochePalette.oroOscuro,
          "--coral": nochePalette.coral,
          "--coral-osc": nochePalette.coralOscuro,
          "--display": '"Bungee", system-ui, sans-serif',
          "--texto": '"Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", sans-serif',
          colorScheme: "dark",
        },
        "html, body, #root": { height: "100%" },
        body: {
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "var(--noche)",
          backgroundImage: [
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.28) 1px, transparent 1.6px)",
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.16) 1px, transparent 1.6px)",
          ].join(","),
          backgroundSize: "47px 47px, 73px 73px",
          backgroundPosition: "0 0, 21px 33px",
          paddingTop: "env(safe-area-inset-top, 0)",
          paddingBottom: "env(safe-area-inset-bottom, 0)",
        },
        ".titulo-display": {
          fontFamily: "var(--display)",
          fontWeight: 400,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 800 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

export default theme;
