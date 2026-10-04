shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, shadows_disabled, depth_draw_opaque;

uniform sampler2D noise_tex : source_color;
uniform vec3 fire_hot : source_color = vec3(1.0, 0.92, 0.45);
uniform vec3 fire_cool : source_color = vec3(0.95, 0.22, 0.03);
uniform float time_scale = 0.62;

void fragment() {
	vec2 uv = UV;
	float n1 = texture(noise_tex, uv * vec2(1.15, 0.65) + vec2(0.0, -TIME * time_scale)).r;
	float n2 = texture(noise_tex, uv * vec2(2.4, 1.5) + vec2(0.18, -TIME * time_scale * 1.7)).r;
	float n = n1 * 0.62 + n2 * 0.38;
	float sides = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x);
	float rise = pow(clamp(1.05 - uv.y, 0.0, 1.0), 1.2);
	float flame = smoothstep(0.22, 0.78, n * rise * sides * 1.75);
	ALBEDO = mix(fire_cool, fire_hot, clamp(flame * 1.3 + (1.0 - uv.y) * 0.25, 0.0, 1.0)) * flame * 2.8;
	ALPHA = flame;
}
