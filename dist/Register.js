var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { extract_user_id } from "freeflow-core/dist/utils";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import validator from "validator";
import { AxiosError } from "axios";
import { context } from "./index";
export const Register = () => {
    var [verf_code_status, set_verf_code_status] = useState(); // progress , sent , failed
    var { profiles_seed, set_state, cache, configured_axios } = useContext(context);
    var nav = useNavigate();
    const [verf_code, set_verf_code] = useState();
    const [checked, setChecked] = useState(false);
    const [email, set_email] = useState();
    function create_new_account() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var { jwt } = (yield configured_axios({
                    url: "/register",
                    data: Object.assign({ email_address: email, verf_code }, (checked ? { exp_duration: 7 * 3600 * 24 } : undefined)),
                    method: "post",
                })).data;
                alert("New account was created successfully.");
                var user_id = extract_user_id(jwt);
                if (!profiles_seed.map((p_seed) => p_seed.user_id).includes(user_id)) {
                    set_state((prev) => (Object.assign(Object.assign({}, prev), { profiles_seed: [
                            ...prev.profiles_seed.map((i) => (Object.assign(Object.assign({}, i), { is_active: false }))),
                            { user_id, jwt, is_active: true, max_sync_depth: 3 },
                        ] })));
                }
                nav("/");
            }
            catch (error) {
                if (error instanceof AxiosError && ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 403) {
                    alert("Access Denied. you requested something you have not privilege to do.");
                }
                else {
                    console.log(error);
                    alert("Something went wrong. find out more in console.");
                }
            }
        });
    }
    function send_verification_code() {
        return __awaiter(this, void 0, void 0, function* () {
            return configured_axios({
                url: "/send_verification_code",
                data: {
                    email_address: email,
                },
                method: "post",
            });
        });
    }
    var email_is_used = cache.find((ci) => ci.thing.type === "user" && ci.thing.value.email_address === email) !==
        undefined;
    var email_is_invalid = email && !validator.isEmail(email);
    var submit_must_be_disabled = !email || !verf_code || email_is_used === true || email_is_invalid === true;
    useEffect(() => {
        if (email && !email_is_used && !email_is_invalid) {
            set_verf_code_status("progress");
            send_verification_code().then(() => {
                set_verf_code_status("sent");
            }, () => {
                set_verf_code_status("failed");
            });
        }
    }, [email]);
    return (_jsx("div", { className: "flex items-center justify-center overflow-hidden h-full w-full text-gray-700", children: _jsx("div", { className: "flex flex-col items-center justify-center", children: _jsx("div", { style: {
                    borderRadius: "56px",
                    padding: "0.3rem",
                }, className: "bg-blue-100", children: _jsxs("div", { className: "w-full surface-card py-8 px-5 sm:px-8", style: { borderRadius: "53px" }, children: [_jsxs("div", { className: "text-center mb-5 flex flex-col items-center", children: [_jsx("div", { className: "mb-3 h-24 w-24 rounded-2xl border border-blue-200 overflow-hidden flex items-center justify-center", children: _jsx("i", { className: "bi-person-fill  text-6xl" }) }), _jsx("div", { className: "text-900 text-3xl font-medium mb-3", children: "Welcome !" }), _jsx("span", { className: "text-600 font-medium", children: "Sign up to continue" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "email", className: "block text-900 text-xl font-medium mb-2", children: ["Email Address", " "] }), _jsx(InputText, { type: "text", placeholder: "Type it here", className: `w-full md:w-30rem ${email === "" && "p-invalid"} `, style: { padding: "1rem" }, onChange: (e) => set_email(e.target.value) }), email_is_used && (_jsx("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: "this email is already used." })), email === "" && (_jsx("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: "Error. email can not be empty" })), email_is_invalid && (_jsx("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: "Error. email format is incorrect." })), _jsx("label", { htmlFor: "verf_code", className: "block text-900 text-xl font-medium mb-2 mt-5", children: "Verification Code" }), _jsx(InputText, { type: "text", placeholder: "we send code automatically.", className: `w-full md:w-30rem${email === "" && "p-invalid"} `, style: { padding: "1rem" }, onChange: (e) => set_verf_code(e.target.value) }), email && !email_is_used && !email_is_invalid && (_jsxs("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: [verf_code_status === "failed" &&
                                            "Error. could not send verification codes.", verf_code_status === "sent" && `verification code is sent.`, verf_code_status === "progress" &&
                                            "sending verification code ..."] })), verf_code === "" && (_jsx("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: "Error. verf code can not be empty" })), _jsxs("div", { className: "flex align-items-center justify-content-between mb-5 gap-5 mt-5", children: [_jsxs("div", { className: "flex align-items-center", children: [_jsx(Checkbox, { checked: checked, onChange: (e) => setChecked(Boolean(e.checked)), className: "mr-2" }), _jsx("label", { htmlFor: "rememberme1", children: "Expire Login in 7 days" })] }), _jsx("button", { onClick: () => nav("/login"), className: "font-medium no-underline ml-2 text-right cursor-pointer  border-0", children: "Already have an account?" })] }), _jsx(Button, { disabled: submit_must_be_disabled, label: "Sign Up", className: "w-full p-3 text-xl", onClick: create_new_account })] })] }) }) }) }));
};
