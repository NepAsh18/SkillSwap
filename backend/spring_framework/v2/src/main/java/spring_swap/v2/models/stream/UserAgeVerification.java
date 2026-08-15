package spring_swap.v2.models.stream;

import jakarta.persistence.*;
import lombok.*;
import spring_swap.v2.models.auth.User;

import java.time.Instant;

/**
 * Tracks whether a user has passed age verification.

 * Flow:
 *  1. Frontend performs ZK proof locally (client-side).
 *  2. Frontend POSTs the proof string to /api/v1/videos/verify-age.
 *  3. We hash (SHA-256) the proof for an audit trail and mark the user verified.
 *  4. Verified users can access is18Plus=true content.
 *  5. Admin can revoke verification at any time.
 */
@Entity
@Table(name = "user_age_verifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserAgeVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    /** SHA-256 of the raw ZK proof — never store the proof itself. */
    @Column(name = "zk_proof_hash", length = 64)
    private String zkProofHash;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    /** Set when an admin revokes; cleared on re-verification. */
    @Column(name = "revoked_at")
    private Instant revokedAt;
}