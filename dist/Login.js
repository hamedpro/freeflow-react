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
import { Password } from "primereact/password";
import { InputText } from "primereact/inputtext";
import { flexible_user_finder } from "freeflow-core/dist/utils";
import { context } from "./index";
export const Login = () => {
    const [verf_code_or_password, set_verf_code_or_password] = useState();
    const [checked, setChecked] = useState(false);
    const [identifier, set_identifier] = useState("");
    const [verf_code_status, set_verf_code_status] = useState(); // sent or failed or progress
    var { profiles_seed, set_state, cache, configured_axios, calc_file_url } = useContext(context);
    var nav = useNavigate();
    function login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var { jwt } = (yield configured_axios({
                    url: "login",
                    data: Object.assign({ value: verf_code_or_password, identifier }, (checked ? { exp_days: 7 } : undefined)),
                    method: "post",
                })).data;
                alert("Authentication was done.");
                var user_id = extract_user_id(jwt);
                // if this user is logged in before, we delete its former profile seed
                set_state((prev) => (Object.assign(Object.assign({}, prev), { profiles_seed: prev.profiles_seed.filter((ps) => ps.user_id !== user_id) })));
                set_state((prev) => (Object.assign(Object.assign({}, prev), { profiles_seed: [
                        ...prev.profiles_seed.map((i) => (Object.assign(Object.assign({}, i), { is_active: false }))),
                        { user_id, jwt, is_active: true, max_sync_depth: 3 },
                    ] })));
                nav("/");
            }
            catch (error) {
                console.log(error);
                alert(`Error! something in Login
            function gone wrong.
            find more info in console`);
            }
        });
    }
    var matching_user_id = flexible_user_finder(cache, identifier);
    if (matching_user_id !== undefined) {
        var matching_user = cache.find((cache_item) => cache_item.thing_id === matching_user_id);
    }
    function send_verification_code() {
        return __awaiter(this, void 0, void 0, function* () {
            if (matching_user === undefined) {
                throw `send_verification_code func is only called
            where we're sure matching user is not undefined.
            but it was undefined!`;
            }
            return yield configured_axios({
                url: "/send_verification_code",
                data: {
                    email_address: matching_user.thing.value.email_address,
                },
                method: "post",
            });
        });
    }
    useEffect(() => {
        if (matching_user !== undefined) {
            set_verf_code_status("progress");
            send_verification_code().then(() => {
                set_verf_code_status("sent");
            }, () => {
                set_verf_code_status("failed");
            });
        }
    }, [matching_user_id]);
    var no_matching_user = identifier !== "" && matching_user_id === undefined;
    return (_jsx("div", { className: "flex items-center justify-center overflow-hidden h-full w-full text-gray-700", children: _jsx("div", { className: "flex flex-col items-center justify-center", children: _jsx("div", { style: {
                    borderRadius: "56px",
                    padding: "0.3rem",
                }, className: "bg-blue-100", children: _jsxs("div", { className: "w-full surface-card py-8 px-5 sm:px-8", style: { borderRadius: "53px" }, children: [_jsxs("div", { className: "text-center mb-5 flex flex-col items-center", children: [_jsx("div", { className: "mb-3 h-24 w-24 rounded-2xl border border-blue-200 overflow-hidden flex items-center justify-center", children: matching_user &&
                                        matching_user.thing.value.profile_image_file_id ? (_jsx("img", { src: calc_file_url(matching_user.thing.value.profile_image_file_id), alt: "Image", className: "w-full h-full" })) : (_jsx("i", { className: "bi-person-fill  text-6xl" })) }), _jsxs("div", { className: "text-900 text-3xl font-medium mb-3", children: ["Welcome", " ", matching_user &&
                                            (matching_user.thing.value.full_name ||
                                                matching_user.thing.value.email_address), "!"] }), _jsx("span", { className: "text-600 font-medium", children: "Sign in to continue" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-900 text-xl font-medium mb-2", children: ["Email or User id", " "] }), _jsx(InputText, { type: "text", placeholder: "your user id or email", className: `w-full md:w-30rem ${no_matching_user && "p-invalid"} `, style: { padding: "1rem" }, onChange: (e) => set_identifier(e.target.value) }), no_matching_user && (_jsx("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: "there is not any matching user" })), _jsx("label", { className: "block text-900 font-medium text-xl mb-2 mt-5", children: "Password or verification code" }), _jsx(Password, { feedback: false, onChange: (e) => set_verf_code_or_password(e.target.value), placeholder: "we send verf code automatically", toggleMask: true, className: "w-full", inputClassName: "w-full p-3 md:w-30rem" }), !no_matching_user && (_jsxs("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: [verf_code_status === "failed" &&
                                            "Error. could not send verification codes.", verf_code_status === "sent" && `verification code is sent.`, verf_code_status === "progress" &&
                                            "sending verification code ..."] })), verf_code_or_password === "" && (_jsx("span", { className: "block text-xs text-gray-600 w-full md:w-30rem mt-2", children: "Error. password can not be empty" })), _jsxs("div", { className: "flex align-items-center justify-content-between mb-5 gap-5 mt-5", children: [_jsxs("div", { className: "flex align-items-center", children: [_jsx(Checkbox, { checked: checked, onChange: (e) => setChecked(Boolean(e.checked)), className: "mr-2" }), _jsx("label", { htmlFor: "rememberme1", children: "Expire Login in 7 days" })] }), _jsx("button", { onClick: () => {
                                                nav("/forget-password");
                                            }, className: "font-medium no-underline ml-2 text-right cursor-pointer", style: {}, children: "Forgot password?" })] }), _jsx(Button, { disabled: no_matching_user, label: "Sign In", className: "w-full p-3 text-xl", onClick: login })] })] }) }) }) }));
};
