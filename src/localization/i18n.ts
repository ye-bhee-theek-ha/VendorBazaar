import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

const i18n = new I18n({
  en: {
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    name: "Name",
  },
  af: {
    login: "Teken in",
    register: "Registreer",
    email: "E-pos",
    password: "Wagwoord",
    name: "Naam",
  },
});

i18n.locale = Localization.locale.startsWith("af") ? "af" : "en";

export default i18n;
