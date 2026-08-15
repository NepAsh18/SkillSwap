package spring_swap.v2.dtos.stream;



import jakarta.validation.constraints.NotBlank;

/**
 * Carries the ZK proof produced by the client.
 * The server never evaluates the proof directly — it hashes it for audit
 * and marks the user verified. Full ZK circuit verification will be wired
 * in when the on-chain verifier contract is ready.
 */
public record AgeVerificationRequestDTO(

        @NotBlank(message = "ZK proof is required")
        String zkProof
) {}